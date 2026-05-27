import { useMemo } from 'react'
import { ReactEChartsCore } from '@/chartWrapper'
import echarts from '@/echarts'
import useStore from '@/store/useStore'
import { getRadarOption } from '@/charts/profileRadar'

function ProfilePanel() {
  const filteredData = useStore(s => s.filteredData)
  const selectedDate = useStore(s => s.selectedDate)

  const profile = useMemo(() => {
    if (!filteredData.length) return null
    if (selectedDate) {
      return filteredData.find(d => d.date === selectedDate) || filteredData[filteredData.length - 1]
    }
    // Default: last 7 days average
    const last7 = filteredData.slice(-7)
    const avg = {}
    Object.keys(last7[0]).forEach(k => {
      avg[k] = typeof last7[0][k] === 'number'
        ? +(last7.reduce((s, d) => s + d[k], 0) / last7.length).toFixed(1)
        : last7[last7.length - 1][k]
    })
    return avg
  }, [filteredData, selectedDate])

  const option = useMemo(() => getRadarOption(profile), [profile])

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span className="title-icon">🎯</span> 多维画像
        {selectedDate && <span style={{ fontSize: '0.75rem', color: '#2ecc71', marginLeft: 8 }}>日期: {selectedDate}</span>}
      </div>
      <div className="chart-container">
        {option ? (
          <ReactEChartsCore echarts={echarts} option={option} style={{ height: 380 }} notMerge />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 380, color: '#95a5a6' }}>
            点击散点图数据点查看个体画像
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePanel
