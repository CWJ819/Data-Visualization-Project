import { PERIODS, PERIOD_COLORS } from '../../shared/constants/periods'

const FORM_COLORS = {
  '绝句': '#58a6ff', '律诗': '#79c0ff', '排律': '#a5d6ff',
  '歌行': '#f0883e', '古体': '#d29922', '词': '#8b7bb5',
}

export function buildGenreOption(genreData, selectedPeriod) {
  if (!genreData) return null
  const byPeriod = genreData.by_period

  const allForms = new Set()
  PERIODS.forEach(p => {
    if (byPeriod[p]) Object.keys(byPeriod[p].forms).forEach(f => allForms.add(f))
  })
  const forms = [...allForms]

  const markAreaData = selectedPeriod
    ? [[
        { xAxis: selectedPeriod, itemStyle: { color: PERIOD_COLORS[selectedPeriod] + '22' } },
        { xAxis: selectedPeriod },
      ]]
    : []

  const series = forms.map((form, i) => ({
    name: form,
    type: 'line',
    stack: 'total',
    areaStyle: {},
    data: PERIODS.map(p => byPeriod[p]?.forms[form] ?? 0),
    itemStyle: { color: FORM_COLORS[form] ?? `hsl(${i * 47}, 60%, 55%)` },
    lineStyle: { width: 0 },
    symbol: 'none',
    ...(i === 0 ? {
      markArea: { data: markAreaData, silent: true },
    } : {}),
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      backgroundColor: '#161b22', borderColor: '#30363d',
      textStyle: { color: '#e6edf3' },
    },
    legend: {
      data: forms, top: 4, right: 8,
      textStyle: { color: '#8b949e', fontSize: 12 },
    },
    grid: { top: 36, bottom: 40, left: 50, right: 30 },
    xAxis: {
      type: 'category', data: PERIODS,
      axisLabel: { color: p => PERIOD_COLORS[p] ?? '#8b949e', fontSize: 13 },
      axisLine: { lineStyle: { color: '#30363d' } },
    },
    yAxis: {
      type: 'value', max: 100, name: '%',
      axisLabel: { color: '#8b949e', fontSize: 11 },
      splitLine: { lineStyle: { color: '#21262d' } },
    },
    series,
  }
}
