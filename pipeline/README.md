# pipeline/ — 数据处理管道（确定性重构版）

把 `dataset/`（全唐诗 + 宋词）处理成仪表盘可用的数据。
**完全确定性、可复现、繁简统一**；LLM 仅为默认关闭的可选附件。

## 数据流

```
dataset/全唐诗/poet.tang.*        ┐
dataset/宋词/ci.song.*            ├─ ingest.py ──→ output/corpus/poems.jsonl  (canonical 语料)
dataset/五代诗词/huajianji/*.json  │                         │
dataset/五代诗词/nantang/*.json   ┘                         │
作者元数据 / 三百首选集                                       │
                                                             ├─ enrich_llm.py ──→ output/enrich/enriched.jsonl
                                                             │   (DeepSeek LLM 情感富化；无 API_KEY 自动跳过)
                                                             │
                                                             ├─ metrics.py ──→ dashboard/data/*.json
                                                             │   (读取 enriched.jsonl，词典法+LLM双轨情感)
                                                             └─ qa.py（校验 corpus + dashboard）
```

运行顺序：`ingest.py → enrich_llm.py → metrics.py → qa.py`。

## 各脚本

| 脚本 | 职责 | 输入 → 输出 |
|---|---|---|
| `config.py` | **单一事实源**：时期/事件/断裂、唐宋诗人→时期表、年号表、情感词典、宏大/私人意象集、地名坐标、体裁规则、策展名篇、五代词路径/作者规范化 | — |
| `normalize.py` | 繁→简（opencc，失败回退字表）、去标点、分词、繁体残留检测 | — |
| `ingest.py` | 源固定+防呆断言、繁简归一、体裁、**定年阶梯**、去重、名气标记；**加载花间集+南唐二主词并入晚唐五代** | dataset → `output/corpus/poems.jsonl` |
| `enrich_llm.py` | DeepSeek LLM 情感富化（`--scope stars` 默认只处理选集名篇~600首）；无 API_KEY 自动跳过 | corpus → `output/enrich/enriched.jsonl` |
| `metrics.py` | 确定性指标，`--scope full\|representative\|anthology`（默认 representative）；**自动读取 enriched.jsonl，双轨情感输出** | corpus + enriched → `dashboard/data/*.json` |
| `qa.py` | 严格JSON/时期单调/繁体残留=0/去重/定年对账/坐标 校验 | 读 corpus + dashboard，退出码反映结果 |
| `_legacy/` | 旧版脚本留底，不再使用 | — |

## 核心设计（为什么这么做）

- **繁简统一**：唐诗繁体、宋词简体，不统一则词频/意象对比会把"繁简差异"误当"时代差异"。`text`(简体)供统计，`text_raw`保留原文。
- **定年 = 有序时期，不伪造年份**：逐首创作年不可恢复。唐用 `诗人表→bio年号` 定到时期（~75% 唐诗），宋词用 `词人表→bio生年(阈1085)` 分北宋/南宋；定不了→`未定年`（不进时间轴，仍进对比/词频/意象）。
- **五期 + 两大断裂**：盛唐→中唐→晚唐五代→北宋→南宋；接缝 755（安史之乱）、1127（靖康之变）。
- **流 / 繁星**：`full` 聚合=时代面貌（流）；`唐诗三百首+宋词三百首`名篇逐首=繁星（`stars.json`）。

## canonical schema（poems.jsonl 每行）

`id, dynasty(唐/宋), genre_type(诗/词), author, title, ci_pai, period(盛唐/中唐/晚唐五代/北宋/南宋/未定年), period_source, period_confidence, datable, text_raw, text(简体), lines, char_count, form, in_anthology, is_representative, curated_tags[], source_file`

## dashboard/data 产物

| 文件 | 内容 |
|---|---|
| `meta.json` | 规模、各时期计数、scope、datable比例、事件表 |
| `sentiment_by_period.json` | 各时期情感均值（含唐/宋分列） |
| `imagery_flow.json` | 各时期宏大/私人意象频率 + externality(宏/私) |
| `genre_by_period.json` | 各时期体裁占比 |
| `word_freq_comparison.json` | 唐 vs 宋词词频（已统一简体） |
| `place_geo.json` | 地名分布（按时期/朝代）+ 坐标 |
| `stars.json` | 繁星：三百首名篇逐首（情感分/主意象/名句/时期） |
| `rupture_755.json` / `rupture_1127.json` | 两大断裂断面：前后时期对比 + 升降词 + 策展星 |

## 运行

```bash
export PYTHONIOENCODING=utf-8          # Windows 控制台

python pipeline/ingest.py              # 语料构建（含五代词）
python pipeline/enrich_llm.py --resume # LLM 情感富化；无 API_KEY 自动跳过
python pipeline/metrics.py             # 指标聚合；默认 representative，--scope full 交叉验证
python pipeline/qa.py                  # 校验

# 首次启用 LLM 富化需先设置 key
export DEEPSEEK_API_KEY=<your_key>
```

依赖：`opencc`（繁→简）；`requests`（仅 enrich_llm）。
