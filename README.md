# 唐宋诗词的时代回响

数据可视化导论 · 课程项目 · 第 2 小组

以约 **7.8 万首**唐诗/宋词为素材，用文本计量 + 可视化考察文学如何回应**安史之乱（755）**与**靖康之变（1127）**两次历史断裂。

## 快速启动

**环境要求**：Python ≥ 3.9、Node.js ≥ 18、conda

```bash
# 1. 数据管道
conda activate vis
pip install opencc-python-reimplemented requests
export PYTHONIOENCODING=utf-8

python pipeline/ingest.py
python pipeline/enrich_llm.py --resume   # 需 DEEPSEEK_API_KEY；未设置则跳过

# 2. 前端仪表盘
cd new_dashboard
npm install
npm run preprocess                       # 从 enriched_temp.jsonl 预聚合数据
npm run dev                              # → http://localhost:5173
```

`enrich_llm.py` flags：`--scope stars`（默认，~600 首）| `--scope representative --all-representative`（全量 4.3 万首）| `--resume`

## 仓库结构

```
pipeline/        数据处理管道（ingest → enrich_llm）
new_dashboard/   React + Vite + ECharts 前端（仪表盘）
  data/          LLM 标注中间文件（不进 git）
  public/data/   预聚合 JSON（仪表盘数据，进 git）
  scripts/       preprocess.js 预聚合脚本
report/          正式/中期报告、LaTeX、PPT
dataset/         原始语料（本地，不进 git）
```

## 仪表盘版面

| 区域 | 内容 |
|:--|:--|
| 河流图 A | 8 类情感类型在 12 历史阶段的占比变迁 |
| 河流图 B | 12 类题材在 12 历史阶段的占比变迁 |
| 地理气泡图 | 诗词地点地理编码，按阶段实时渲染 |
| 意象变化折线图 | 10 组关键词每百首频次趋势，选中/取消联动词云 |
| 意象词云 | 按阶段展示 Top 50 意象，点击联动折线图 |
| 左侧滑条 | 竖向单选 1–12 阶段或全部，全局数据过滤 |

## 技术栈

| 层 | 技术 |
|:--|:--|
| 数据管道 | Python · opencc · DeepSeek LLM |
| 预处理 | Node.js 预聚合脚本 |
| 前端 | React 18 · Vite 6 · ECharts 5 · echarts-wordcloud |
| 报告 | Markdown · LaTeX · HTML |
