import 'echarts-wordcloud'
import { useMemo } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { PeriodSelector } from '../../shared/components/PeriodSelector'
import { buildWordCloudOption } from './option'

export function S5WordCloud() {
  const { data: freqData }   = useData('word_freq_comparison')
  const { data: periodFreq } = useData('word_freq_by_period')
  const { selectedPeriod }   = useStore()

  const option = useMemo(
    () => buildWordCloudOption(freqData, periodFreq, selectedPeriod),
    [freqData, periodFreq, selectedPeriod]
  )

  return (
    <div className="screen">
      <h2 className="screen-title">唐诗 vs 宋词 · 词频对比</h2>
      <p className="screen-subtitle">
        选择时期查看该时期高频词云；不选则并列展示全唐 vs 全宋总体词频。
        繁简已统一为简体，可直接对比。
      </p>
      <PeriodSelector style={{ marginBottom: 16 }} />
      {!selectedPeriod && (
        <p style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
          当前显示全唐 vs 全宋总体词频，非所选时期专属。
        </p>
      )}
      <div className="card">
        <ChartBox option={option} style={{ height: 480 }} />
      </div>
    </div>
  )
}
