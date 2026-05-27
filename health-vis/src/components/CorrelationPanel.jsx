import { useMemo, useRef } from 'react'
import { ReactEChartsCore } from '@/chartWrapper'
import echarts from '@/echarts'
import useStore from '@/store/useStore'
import { getScatterOption } from '@/charts/scatterBubble'

function CorrelationPanel() {
  const filteredData = useStore(s => s.filteredData)
  const setSelectedDate = useStore(s => s.setSelectedDate)
  const chartRef = useRef(null)

  const option = useMemo(() => getScatterOption(filteredData), [filteredData])

  const onChartReady = (instance) => {
    chartRef.current = instance
    // Bind click event manually (echarts-for-react v3 compatible)
    instance.on('click', (params) => {
      if (params.componentType === 'series' && params.data?.value?.[3]) {
        setSelectedDate(params.data.value[3])
      }
    })
  }

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span className="title-icon">🔬</span> 热量差 vs 体重变化
        <span style={{ fontSize: '0.75rem', color: '#95a5a6', marginLeft: 8 }}>点击数据点查看详情</span>
      </div>
      <div className="chart-container">
        {option && Object.keys(option).length > 0 ? (
          <ReactEChartsCore
            echarts={echarts} option={option}
            style={{ height: 380 }} notMerge
            onChartReady={onChartReady}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 380, color: '#95a5a6' }}>
            暂无数据
          </div>
        )}
      </div>
    </div>
  )
}

export default CorrelationPanel
