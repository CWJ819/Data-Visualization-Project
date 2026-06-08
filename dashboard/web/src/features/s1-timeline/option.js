import { PERIOD_COLORS, POLARITY_COLORS, RUPTURE_EVENTS } from '../../shared/constants/periods'

/**
 * 纯函数：构建 S1 情感时间轴 ECharts option。
 * @param {object} sentData  sentiment_by_period.json
 * @param {object} starsData stars.json
 * @param {string|null} selectedPeriod
 * @param {function} onMarkLineClick  (year) => void
 * @param {function} onStarClick      (star) => void
 */
export function buildTimelineOption(sentData, starsData, selectedPeriod, onMarkLineClick, onStarClick) {
  if (!sentData) return null
  const periods = sentData.by_period.map(d => d.period)
  const lexScores = sentData.by_period.map(d => d.sentiment_score)
  const llmScores = sentData.by_period.map(d => d.llm_sentiment_score ?? null)

  // 星点：按时期过滤，固定 Y=1.08
  const stars = (starsData?.stars || []).filter(
    s => !selectedPeriod || s.period === selectedPeriod
  )
  const starPoints = periods.map(p => {
    const ps = stars.filter(s => s.period === p)
    return ps.map(s => ({
      value: [p, 1.08],
      starData: s,
      itemStyle: { color: POLARITY_COLORS[s.polarity_llm] ?? POLARITY_COLORS[null] },
    }))
  }).flat()

  // markArea 高亮选中时期
  const markAreaData = selectedPeriod
    ? [[{ xAxis: selectedPeriod, itemStyle: { color: PERIOD_COLORS[selectedPeriod] + '22' } },
        { xAxis: selectedPeriod }]]
    : []

  // 断裂 markLine
  const ruptureLines = RUPTURE_EVENTS.map(e => ({
    xAxis: e.year <= 755 ? '中唐' : '南宋',   // 对应时期
    label: { formatter: `${e.name}\n${e.year}`, position: 'insideStartTop', color: '#d29922' },
    lineStyle: { color: '#d29922', type: 'dashed', width: 1.5 },
  }))

  return {
    backgroundColor: 'transparent',
    grid: { top: 40, bottom: 50, left: 60, right: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161b22',
      borderColor: '#30363d',
      textStyle: { color: '#e6edf3' },
    },
    legend: {
      data: ['词典法情感', 'LLM精标'],
      top: 8, right: 8,
      textStyle: { color: '#8b949e', fontSize: 12 },
    },
    xAxis: {
      type: 'category', data: periods,
      axisLabel: {
        color: p => PERIOD_COLORS[p] ?? '#8b949e',
        fontSize: 13,
      },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    yAxis: {
      type: 'value', min: -1, max: 1.2,
      axisLabel: { color: '#8b949e', fontSize: 11 },
      splitLine: { lineStyle: { color: '#21262d' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: '词典法情感',
        type: 'line',
        data: periods.map((p, i) => ({ value: [p, lexScores[i]] })),
        lineStyle: { type: 'dashed', color: '#79c0ff', width: 2 },
        itemStyle: { color: '#79c0ff' },
        symbolSize: 6,
        markArea: { data: markAreaData, silent: true },
        markLine: {
          data: ruptureLines,
          silent: false,
          symbol: ['none', 'none'],
        },
      },
      {
        name: 'LLM精标',
        type: 'line',
        data: periods.map((p, i) => ({ value: [p, llmScores[i]] })),
        lineStyle: { color: '#f0883e', width: 2 },
        itemStyle: { color: '#f0883e' },
        symbolSize: 6,
        connectNulls: false,
      },
      {
        name: '名篇星点',
        type: 'scatter',
        data: starPoints,
        symbolSize: d => 8,
        zlevel: 2,
        tooltip: {
          formatter: p => {
            const s = p.data.starData
            return `<b>${s.author}《${s.title}》</b><br/>${s.key_line}<br/>${s.period}`
          },
        },
      },
    ],
  }
}
