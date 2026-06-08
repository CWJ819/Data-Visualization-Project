# 唐宋诗词的时代回响 · 可视化仪表盘

数据可视化导论课程项目
以约 7.8 万首唐诗/宋词为素材，用文本计量 + 可视化考察文学如何回应安史之乱（755）与靖康之变（1127）两次历史断裂。

---

## 快速启动

**前置条件**：Node.js ≥ 18

```bash
# 1. 进入前端工程目录
cd dashboard/web

# 2. 安装依赖
npm install

# 3. 启动开发服务器（数据已在 public/data/，无需额外拷贝）
npm run dev
# → 浏览器打开 http://localhost:5173
```

> 若重跑 `pipeline/metrics.py` 更新了数据，需将新产物拷贝到 `dashboard/web/public/data/`：
> ```bash
> cp -r pipeline/output/../dashboard/data/* dashboard/web/public/data/
> # 或直接重新跑：python pipeline/metrics.py 后把 dashboard/data/ 同步过来
> ```

---

## 目录结构

```
dashboard/
├── data/                    # 管道产物（pipeline/metrics.py 生成，10 个 JSON）
│   ├── meta.json            # 语料规模、时期顺序、历史事件表
│   ├── sentiment_by_period.json
│   ├── imagery_flow.json
│   ├── genre_by_period.json
│   ├── place_geo.json
│   ├── word_freq_comparison.json
│   ├── word_freq_by_period.json
│   ├── stars.json           # 592 首选集名篇（含 LLM 情感标注）
│   ├── rupture_755.json
│   └── rupture_1127.json
└── web/                     # Vite + React 前端工程
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   ├── data/            # 仪表盘 JSON（进 git，直接 fetch 使用）
    │   └── map/china.json   # 中国地图 GeoJSON（DataV，568 KB）
    └── src/
        ├── App.jsx          # 六屏容器 + 顶部导航
        ├── echarts.js       # ECharts 按需注册
        ├── shared/          # 公共模块（所有屏共用）
        │   ├── constants/periods.js   # 时期名、颜色、断裂事件
        │   ├── store/index.js         # Zustand 全局状态
        │   ├── hooks/useData.js       # fetch + 内存缓存
        │   └── components/
        │       ├── ChartBox.jsx       # ECharts 容器（init-once 模式）
        │       ├── StarDrawer.jsx     # 诗作详情侧边栏
        │       └── PeriodSelector.jsx # 时期切换按钮
        └── features/        # 六屏，一屏一文件夹
            ├── s1-timeline/ → 情感时间轴
            ├── s2-imagery/  → 意象河流图
            ├── s3-genre/    → 体裁演化
            ├── s4-geo/      → 地理地图
            ├── s5-wordcloud/→ 词频双词云
            └── s6-rupture/  → 断裂断面
```

---

## 六屏说明

| 屏 | 主题 | 数据 | 核心图表 |
|:--|:--|:--|:--|
| S1 | 历史时间轴 · 情感温度计 | sentiment_by_period | 折线（词典法虚线 + LLM 实线）+ 断裂 markLine |
| S2 | 意象的生死流转 | imagery_flow | ThemeRiver（宏大/私人意象）+ externality 折线叠加 |
| S3 | 诗体的新陈代谢 | genre_by_period | 百分比堆叠面积 |
| S4 | 地域空间坍缩 | place_geo | 中国地图散点（按时期/总体切换） |
| S5 | 词频对比 | word_freq_comparison / word_freq_by_period | 双词云（选时期显示该时期词云） |
| S6 | 两大断裂断面 | rupture_755 / rupture_1127 | before/after 双柱 + 升降词条 + 策展名篇 |

**多视图联动**：点击任意时期标签 → 所有视图同步聚焦该时期；点击 S1/S2 断裂竖线 → 滚动至 S6；点击名篇星点 → 侧边栏展示诗作详情。

---

## 技术栈

| 工具 | 用途 |
|:--|:--|
| React 18 + Vite 6 | UI 框架 + 构建工具 |
| ECharts 5 | 核心图表（themeRiver / geo / scatter / line / bar） |
| echarts-wordcloud | 词云插件 |
| Zustand | 跨屏全局状态（selectedPeriod / activeStar） |

---

## 数据更新

若需重新生成仪表盘数据（修改管道后）：

```bash
# 在项目根目录
python pipeline/ingest.py
python pipeline/enrich_llm.py --resume   # 需 DEEPSEEK_API_KEY
python pipeline/metrics.py
python pipeline/qa.py

# 更新前端 public 目录
cp -r dashboard/data dashboard/web/public/data
```

---

## 构建 & 部署

```bash
cd dashboard/web
npm run build     # 产出静态包到 dist/
npm run preview   # 本地预览构建结果
```

`dist/` 是纯静态包，可直接部署到 GitHub Pages 或课程服务器，无需后端。
