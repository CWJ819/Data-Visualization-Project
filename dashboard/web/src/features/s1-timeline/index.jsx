import { useMemo } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { PeriodSelector } from '../../shared/components/PeriodSelector'
import { buildTimelineOption } from './option'

export function S1Timeline() {
  const { data: sentData } = useData('sentiment_by_period')
  const { data: starsData } = useData('stars')
  const { selectedPeriod, setSelectedPeriod, setActiveStar, setHighlightRupture } = useStore()

  const onMarkLineClick = (year) => {
    setHighlightRupture(year)
    document.getElementById('s6')?.scrollIntoView({ behavior: 'smooth' })
  }

  const onStarClick = (star) => setActiveStar(star)

  const option = useMemo(
    () => buildTimelineOption(sentData, starsData, selectedPeriod, onMarkLineClick, onStarClick),
    [sentData, starsData, selectedPeriod]
  )

  const onEvents = {
    click: (params) => {
      if (params.seriesName === '名篇星点') {
        onStarClick(params.data.starData)
      } else if (params.componentType === 'markLine') {
        const year = params.data.name?.includes('755') ? 755 : 1127
        onMarkLineClick(year)
      } else if (params.componentType === 'xAxis' || params.seriesType === 'line') {
        const period = params.name || params.data?.[0]
        if (period) setSelectedPeriod(selectedPeriod === period ? null : period)
      }
    },
  }

  return (
    <div className="screen">
      <h2 className="screen-title">历史时间轴 · 情感温度计</h2>
      <p className="screen-subtitle">
        词典法（虚线）覆盖全量 43,332 首；LLM精标（实线）覆盖 609 首选集名篇。
        点击时期列高亮联动，点击断裂竖线跳转断面分析。
      </p>
      <PeriodSelector style={{ marginBottom: 16 }} />
      <div className="card">
        <ChartBox
          option={option}
          style={{ height: 460 }}
          onEvents={onEvents}
        />
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
        ※ LLM精标仅覆盖选集名篇，不代表各时期全量均值；词典法趋势方向可信，绝对值仅供参考。
      </p>
    </div>
  )
}
