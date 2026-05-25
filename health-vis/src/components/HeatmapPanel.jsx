import { useMemo } from 'react'
import { ReactEChartsCore } from '@/chartWrapper'
import echarts from '@/echarts'
import useStore from '@/store/useStore'
import { getHeatmapOption } from '@/charts/correlationHeatmap'

function HeatmapPanel() {
  const correlations = useStore(s => s.correlations)
  const option = useMemo(() => {
    if (!correlations) return null
    return getHeatmapOption(correlations)
  }, [correlations])

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span className="title-icon">🕸️</span> 相关矩阵 (Pearson)
      </div>
      <div className="chart-container">
        {option ? (
          <ReactEChartsCore echarts={echarts} option={option} style={{ height: 380 }} notMerge />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 380, color: '#8892a4' }}>
            Calculating...
          </div>
        )}
      </div>
    </div>
  )
}

export default HeatmapPanel
