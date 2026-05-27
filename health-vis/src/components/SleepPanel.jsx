import { useMemo } from 'react'
import { ReactEChartsCore } from '@/chartWrapper'
import echarts from '@/echarts'
import useStore from '@/store/useStore'
import { getSleepOption } from '@/charts/sleepCalendar'

function SleepPanel() {
  const filteredData = useStore(s => s.filteredData)
  const option = useMemo(() => getSleepOption(filteredData), [filteredData])

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span className="title-icon">😴</span> 睡眠分析
      </div>
      <div className="chart-container">
        {option && Object.keys(option).length > 0 ? (
          <ReactEChartsCore echarts={echarts} option={option} style={{ height: 380 }} notMerge />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 380, color: '#95a5a6' }}>
            暂无数据
          </div>
        )}
      </div>
    </div>
  )
}

export default SleepPanel
