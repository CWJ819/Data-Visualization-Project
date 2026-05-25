// Centralized ECharts registration — called once before any component renders
import * as echarts from 'echarts/core'
import { LineChart, BarChart, ScatterChart, HeatmapChart, RadarChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, RadarComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, BarChart, ScatterChart, HeatmapChart, RadarChart,
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, RadarComponent,
  CanvasRenderer,
])

export default echarts
