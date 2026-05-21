# HealthVis — 健康数据可视化分析平台

基于 React + ECharts 的健康数据可视化竞赛模板，聚焦**热量摄入、热量消耗、睡眠质量、营养结构与体重变化的关系分析**。

## 技术栈

| 层 | 选择 |
|---|---|
| 构建工具 | Vite 6 |
| 前端框架 | React 18 + Hooks |
| 状态管理 | Zustand (轻量、subscriber模式) |
| UI 组件 | Ant Design 5 (暗色主题) |
| 标准图表 | ECharts 5 (按需引入 tree-shaking) |
| 设计风格 | 暗色高级主题 + 玻璃态卡片 + 滚动入场动画 |
| 后端 | Python FastAPI + pandas + scikit-learn |
| 演示动画 | Manim (独立运行，将分析过程可视化，3blue1brown-like animation) |

## 快速启动

### 前端

```bash
npm install && npm run dev
# 浏览器打开 http://localhost:3000
```

### 后端 (可选 — 前端自带离线示例数据)

```bash
cd backend
pip install -r requirements.txt
python app.py
# API 文档: http://localhost:8000/docs
```

## 项目结构

```
healthvis/
├── src/
│   ├── App.jsx                    #  根布局 + 数据初始化 + 滚动动画
│   ├── App.less                   #  CSS Grid 布局(2×3) + 暗色主题
│   ├── store/useStore.js          #  Zustand 全局状态 (数据/时间/选中/分析结果)
│   ├── components/                #  6个React面板组件
│   │   ├── DashboardHeader.jsx    #    标题 + DatePicker + 4指标概览卡片
│   │   ├── WeightTrendPanel.jsx   #    体重趋势 + 热量差 (双轴混合图)
│   │   ├── NutritionPanel.jsx     #    营养结构 (堆叠面积图)
│   │   ├── CorrelationPanel.jsx   #    热量差 vs 体重变化 (散点+回归线)
│   │   ├── ProfilePanel.jsx       #    多维画像 (雷达图)
│   │   ├── SleepPanel.jsx         #    睡眠分析 (柱状+折线)
│   │   └── HeatmapPanel.jsx       #    相关性矩阵 (热力图)
│   ├── charts/                    #  ECharts 配置生成器 (纯函数)
│   ├── hooks/                     #  useChart.js / useScrollAnimation.js
│   ├── utils/                     #  sampleData.js / dataTransform.js
│   └── styles/                    #  variables.less / global.less
├── backend/
│   ├── app.py                     #  FastAPI 入口
│   ├── routers/                   #  data.py (查询) / analysis.py (分析)
│   ├── services/analysis.py       #  KMeans聚类 + PCA + 体重变化分析
│   └── scripts/manim_demo.py      #  Manim 动画示例
└── README.md
```

## 6 个可视化面板

| 面板 | 图表类型 | 内容 |
|---|---|---|
| 体重趋势总览 | 双轴折线+柱状 | 体重曲线 + 热量差柱状(红绿编码) + 摄入/消耗虚线 |
| 营养结构分解 | 堆叠面积图 | 碳水/蛋白质/脂肪三大营养素占比 % |
| 热量差 vs 体重变化 | 散点图+回归线 | 圆点大小=睡眠质量，点击联动雷达图 |
| 多维画像 | 雷达图 | 6维归一化指标 (体重/热量/睡眠/碳水) |
| 睡眠分析 | 柱状+折线 | 时长(绿/黄/红)+质量趋势，双Y轴 |
| 相关性矩阵 | 热力图 | 9参数 Pearson 系数，紫→黑→红渐变 |

## 设计特点

- **暗色高级主题**：深色渐变 + 绿色/青色健康主题强调色
- **玻璃态卡片**：backdrop-filter: blur(16px) 毛玻璃
- **滚动入场动画**：IntersectionObserver + 150ms 错峰延迟
- **按钮光泽效果**：hover 时渐变遮罩滑动
- **响应式**：桌面2列 → 移动1列
- **无障碍**：prefers-reduced-motion 支持

## 使用方式

1. **替换数据**：修改 `src/utils/sampleData.js` 生成逻辑或加载真实CSV
2. **自定义图表**：在 `src/charts/` 下修改 ECharts option 配置
3. **调整布局**：修改 `src/App.less` 中的 CSS Grid 参数
4. **添加面板**：在 `src/components/` 新建组件，`App.jsx` 引入
5. **后端分析**：替换 `backend/data/sample.csv` 为真实数据，启动 FastAPI
