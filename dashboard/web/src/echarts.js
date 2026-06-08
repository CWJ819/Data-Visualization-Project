import * as echarts from 'echarts/core'
import {
  LineChart, ThemeRiverChart, BarChart,
  ScatterChart, MapChart,
} from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, TitleComponent, GeoComponent,
  MarkLineComponent, MarkAreaComponent, DataZoomComponent,
  SingleAxisComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, ThemeRiverChart, BarChart, ScatterChart, MapChart,
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, TitleComponent, GeoComponent,
  MarkLineComponent, MarkAreaComponent, DataZoomComponent,
  SingleAxisComponent,
  CanvasRenderer,
])

export default echarts
