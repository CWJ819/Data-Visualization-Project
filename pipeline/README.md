当前 pipeline 设计和预期结果如下，按执行顺序看。

  1. ingest.py
  命令：

  python pipeline/ingest.py

  作用：

  - 读取唐诗、宋词、五代词原始语料。
  - text_raw 保留原文。
  - text 统一转简体。
  - 生成 canonical corpus：

  pipeline/output/corpus/poems.jsonl

  当前预期规模：

  总量：79190
  representative：43332
  datable representative：43304
  未定年：23092

  这里仍然只负责粗时期：

  盛唐 / 中唐 / 晚唐 / 五代 / 北宋 / 南宋 / 未定年

  不在 ingest 阶段生成 1-12 细阶段。

  2. enrich_llm.py
  推荐全量 representative 重跑命令：

  python pipeline/enrich_llm.py --scope representative --all-representative

  注意：如果要让旧 enriched.jsonl 里的阶段格式全部更新，不要加 --resume。加 --resume 会跳过旧记录。

  LLM 负责输出：

  {
    "极性": "积极/中性/消极",
    "类型": ["豪迈"],
    "题材": "边塞战争",
    "意象": ["长安", "月"],
    "创作阶段": "0755-0770"
  }

  但最终写入 enriched.jsonl 时，脚本会把 创作阶段 映射成序号：

  "0755-0770" -> 3

  也就是说：

  - LLM 不输出序号。
  - Python 脚本负责区间到序号的映射。
  - 最终 enriched.jsonl 里的 创作阶段 应是 1-12 的整数。

  未定年 归并规则：

  安史之乱标签 -> 3
  靖康之变标签 -> 11
  盛唐 -> 2
  中唐 -> 4
  晚唐 -> 6
  五代 -> 7
  北宋 -> 9
  南宋 -> 12
  仅知唐 -> 5
  仅知宋 -> 10

  地名处理：

  - LLM 可能漏地名，但脚本会用 config.PLACE_NAMES 从正文中确定性补齐。
  - 因此 意象_llm 中不会漏掉词典内实际地名。
  - 词典外地名不会自动上地图，需要补进 PLACE_NAMES 并给坐标。

  3. metrics.py
  命令：

  python pipeline/metrics.py

  默认 scope：

  representative

  如需全量地名图：

  python pipeline/metrics.py --scope full

  输出：

  dashboard/data/*.json

  其中 place_geo.json 现在有三层地名聚合：

  {
    "by_period": {
      "盛唐": [...]
    },
    "by_stage_order": {
      "1": [...],
      "2": [...],
      ...
      "12": [...]
    },
    "by_dynasty": {
      "唐": [...],
      "宋": [...]
    },
    "stage_meta": [
      {"order": 1, "time_bin": "0713-0742", "label": "盛唐前期"}
    ]
  }

  地点项格式：

  {
    "name": "长安",
    "lng": 108.94,
    "lat": 34.26,
    "count": 176,
    "poem_count": 162
  }

  含义：

  count = 地名总出现次数
  poem_count = 出现该地名的作品数

  by_stage_order 的阶段来源优先级：

  1. enriched.jsonl 中的 创作阶段 序号
  2. enriched.jsonl 中的 创作阶段 区间字符串
  3. 没有 enriched 结果时，用 corpus 的粗时期 deterministic fallback

  因此，只有重跑全量 representative enrich 后，by_stage_order 才会真正细化到 1-12；否则未富化作品会走粗时期 fallback，部分阶段可能为空或偏粗。

  4. qa.py
  命令：

  python pipeline/qa.py

  当前已验证结果：

  dashboard JSON 严格性：OK
  时期序列：OK
  语料校验：OK
  地名坐标范围：OK
  结果：全部通过，0 WARN

  你需要重点确认的设计点

  1. 创作阶段 最终是否应写入 enriched.jsonl 为整数 1-12。
  2. by_stage_order 是否需要默认用 representative，还是要改成 full corpus。
  3. 未定年 的归并默认是否接受：唐 -> 5，宋 -> 10。
  4. 地图地名是否只以 PLACE_NAMES 为准；词典外地名需要补坐标。