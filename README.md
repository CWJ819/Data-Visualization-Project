# 唐宋诗词的时代回响

数据可视化导论 · 课程项目 · 第 2 小组

以约 **7.8 万首**唐诗/宋词为素材，用文本计量 + 可视化考察文学如何回应**安史之乱（755）**与**靖康之变（1127）**两次历史断裂。核心发现：外内比（宏大意象/私人意象）从盛唐 1.79 持续下降至北宋 0.57，南宋回升至 0.73（豪放回潮）。

---

## 快速启动

**环境要求**：Python ≥ 3.9、Node.js ≥ 18、conda

```bash
# 1. 数据管道（生成仪表盘 JSON）
conda activate vis
pip install opencc-python-reimplemented requests
export PYTHONIOENCODING=utf-8

python pipeline/ingest.py
python pipeline/enrich_llm.py --resume   # 可选；需 DEEPSEEK_API_KEY
python pipeline/metrics.py
python pipeline/qa.py                    # 退出码 0 = 全部通过

# 2. 前端仪表盘
cd dashboard/web
npm install
cp -r ../data public/data                # Windows: Copy-Item -Recurse ..\data public\data
npm run dev
# → 浏览器打开 http://localhost:5173
```

---

## 仓库结构

```
pipeline/        数据处理管道（ingest → enrich_llm → metrics → qa）
dashboard/
  data/          仪表盘 JSON（pipeline 产物，11 个文件）
  web/           React + Vite + ECharts 前端（六屏）
  README.md      前端详细说明
report/
  final/         正式报告（01 背景 / 02 任务 / 03 数据 / 04 设计）
  mid/           中期报告 LaTeX 源码与 PDF
dataset/         原始语料（本地，不进 git）
```

---

## 六屏仪表盘

| 屏 | 内容 |
|:--|:--|
| S1 | 情感时间轴（词典法 + LLM 双轨） |
| S2 | 意象河流图（宏大 vs 私人 + externality 折线） |
| S3 | 体裁演化（堆叠面积） |
| S4 | 地域空间坍缩（中国地图散点） |
| S5 | 唐诗 vs 宋词词云（支持按时期切换） |
| S6 | 两大断裂断面（755 / 1127 前后对比 + 策展名篇） |

点击时期标签可跨屏联动；点击名篇星点弹出诗作详情。

---

## 技术栈

| 层 | 技术 |
|:--|:--|
| 数据管道 | Python · opencc · DeepSeek LLM |
| 前端 | React 18 · Vite 6 · ECharts 5 · Zustand |
| 报告 | Markdown · LaTeX |
