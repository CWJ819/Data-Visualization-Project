# pipeline/ — 数据处理管道

把 `dataset/`（全唐诗 + 宋词 + 五代词）处理成仪表盘可用的数据。
**完全确定性、可复现、繁简统一**；LLM 富化已纳入主流程，无 API Key 时自动跳过。

## 数据流

```
dataset/全唐诗/poet.tang.*         ┐
dataset/宋词/ci.song.*             ├─ ingest.py ──→ output/corpus/poems.jsonl
dataset/五代诗词/huajianji/*.json   │                        │
dataset/五代诗词/nantang/*.json    ┘                        │
作者元数据 / 三百首选集 / WUDAI_ANTHOLOGY_KEYS                │
                                                            ├─ enrich_llm.py ──→ output/enrich/enriched.jsonl
                                                            │   (8线程并发；无 DEEPSEEK_API_KEY 自动跳过)
                                                            │
                                                            ├─ metrics.py ──→ dashboard/data/*.json (11个)
                                                            │   (词典法+LLM双轨；含 word_freq_by_period)
                                                            └─ qa.py（校验，退出码0=全通过）
```

运行顺序：`ingest.py → enrich_llm.py → metrics.py → qa.py`

## 各脚本

| 脚本 | 职责 | 输入 → 输出 |
|---|---|---|
| `config.py` | **单一事实源**：时期/断裂/诗人表/年号/词典/意象/地名/体裁/五代词精选 (`WUDAI_ANTHOLOGY_KEYS`) | — |
| `normalize.py` | 繁→简（opencc，失败回退字表）、分词、繁体残留检测 | — |
| `ingest.py` | 防呆断言、繁简归一、体裁分类、定年阶梯、去重、名气标记；花间集+南唐二主词并入晚唐五代；五代词精选标记 `in_anthology` | dataset → `output/corpus/poems.jsonl` |
| `enrich_llm.py` | DeepSeek LLM 情感富化（8线程并发，temperature=0.1，完整正文，分级校验+逐首补跑）；`--scope stars`（默认）处理 in_anthology+策展名篇约 600 首 | corpus → `output/enrich/enriched.jsonl` |
| `metrics.py` | 确定性指标，`--scope full\|representative\|anthology`（默认 representative）；自动读取 enriched.jsonl 双轨情感；输出 11 个 JSON | corpus + enriched → `dashboard/data/*.json` |
| `qa.py` | 严格JSON / 时期单调 / 繁体残留=0 / 去重 / 定年对账 / 坐标范围 | corpus + dashboard，退出码 0=全通过 |
| `_legacy/` | 旧版脚本存档，不再使用，不进 git | — |

## 核心设计

- **繁简统一**：唐诗繁体、宋词/五代词简体；全部经 opencc 转为简体后统计，`text` 供统计，`text_raw` 保留原文展示。
- **定年 = 有序时期，不伪造年份**：唐诗用 `诗人表→bio年号` (~75%)，宋词用 `词人表→bio生年阈值1085`，五代词强制归 `晚唐五代`；定不了→`未定年`（不进时间轴）。
- **五期 + 两大断裂**：盛唐→中唐→晚唐五代→北宋→南宋；接缝 755（安史之乱）、1127（靖康之变）。
- **流 / 繁星双层**：时期聚合=流（宏观趋势）；三百首+五代词精选逐首=繁星（`stars.json`，592首）。
- **LLM 双轨情感**：词典法覆盖全量；LLM 精标覆盖 609 首选集名篇，分级校验确保数据质量。

## canonical schema（poems.jsonl 每行）

```
id, dynasty(唐/宋), genre_type(诗/词), author, title, ci_pai,
period(盛唐/中唐/晚唐五代/北宋/南宋/未定年), period_source, period_confidence,
datable, text_raw, text(简体), lines, char_count, form,
in_anthology, is_representative, curated_tags[], source_file
```

id 前缀规则：全唐诗原 id / `ci_<hash>`（宋词）/ `wudai_<hash>`（五代词）

## dashboard/data 产物（11 个）

| 文件 | 内容 |
|---|---|
| `meta.json` | 语料规模、时期计数、scope、datable 比例、事件表、LLM 富化数 |
| `sentiment_by_period.json` | 各时期情感均值；`sentiment_score`（词典法全量）+ `llm_sentiment_score`（LLM精标） |
| `imagery_flow.json` | 各时期宏大/私人意象频率 + `externality_index`（宏/私比） |
| `genre_by_period.json` | 各时期体裁占比（百分比） |
| `word_freq_comparison.json` | 全唐 vs 全宋词频 Top200（已统一简体） |
| `word_freq_by_period.json` | **各时期词频 Top100**（过滤停用词；前端分时期词云数据源） |
| `place_geo.json` | 地名分布（by_period / by_dynasty）+ 坐标 |
| `stars.json` | 繁星：592 首名篇逐首（含 `polarity_llm / types_llm / theme_llm / stage_llm`） |
| `rupture_755.json` | 安史之乱断面：盛唐 vs 中唐，升降词，策展名篇 |
| `rupture_1127.json` | 靖康之变断面：北宋 vs 南宋，升降词，策展名篇 |

## 运行

```bash
# 环境准备（需 conda vis 环境）
conda activate vis
pip install opencc-python-reimplemented   # 首次使用时安装
export PYTHONIOENCODING=utf-8             # Windows 控制台必须

# 四步顺序执行
python pipeline/ingest.py
python pipeline/enrich_llm.py --resume   # 需 DEEPSEEK_API_KEY；无 key 自动跳过
python pipeline/metrics.py
python pipeline/qa.py                    # 退出码 0 = 全部通过

# LLM 富化（首次需设置 key）
export DEEPSEEK_API_KEY=<your_key>

# 扩大 LLM 样本（可选，待 types_llm 分布图开发时使用）
python pipeline/enrich_llm.py --scope representative --sample-size 3000 --resume
```

**依赖**：`opencc-python-reimplemented`（繁→简，必须）；`requests`（仅 enrich_llm）。

> ⚠️ 若 `normalize.py` 打印 `归一模式=identity`，说明 opencc 未安装，繁体残留会导致 QA 失败。
