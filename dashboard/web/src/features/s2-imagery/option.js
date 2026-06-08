import { PERIODS, PERIOD_COLORS } from '../../shared/constants/periods'

/**
 * 纯函数：构建 S2 意象河流 + externality 折线 option。
 * 布局：上方 30% = externality 折线 grid，下方 65% = themeRiver。
 */
export function buildImageryOption(imgData, selectedPeriod) {
  if (!imgData) return null
  const timeline = imgData.timeline

  // externality 折线数据
  const extData = PERIODS.map(p => {
    const row = timeline.find(d => d.period === p)
    return row?.externality_index ?? null
  })

  // themeRiver 数据：宏大 + 私人两组
  const riverData = []
  PERIODS.forEach(p => {
    const row = timeline.find(d => d.period === p)
    if (!row) return
    riverData.push([p, row.macro_per_1k,   '宏大意象'])
    riverData.push([p, row.private_per_1k, '私人意象'])
  })

  // markArea 高亮
  const markAreaData = selectedPeriod
    ? [[
        { xAxis: selectedPeriod, itemStyle: { color: PERIOD_COLORS[selectedPeriod] + '33' } },
        { xAxis: selectedPeriod },
      ]]
    : []

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#161b22', borderColor: '#30363d',
      textStyle: { color: '#e6edf3' },
    },
    legend: {
      data: ['externality（宏/私）', '宏大意象', '私人意象'],
      top: 4, right: 8,
      textStyle: { color: '#8b949e', fontSize: 12 },
    },
    grid: [{ top: '4%', height: '28%', left: 60, right: 30 }],
    xAxis: [{
      type: 'category', data: PERIODS, gridIndex: 0,
      axisLabel: { show: true, color: p => PERIOD_COLORS[p] ?? '#8b949e', fontSize: 12 },
      axisLine: { lineStyle: { color: '#30363d' } },
    }],
    yAxis: [{
      type: 'value', name: 'externality', gridIndex: 0, min: 0, max: 2.2,
      axisLabel: { color: '#8b949e', fontSize: 11 },
      splitLine: { lineStyle: { color: '#21262d' } },
      axisLine: { show: false },
    }],
    singleAxis: [{
      type: 'category', data: PERIODS,
      top: '38%', height: '56%', left: 60, right: 30,
      axisLabel: { color: p => PERIOD_COLORS[p] ?? '#8b949e', fontSize: 12 },
      axisLine: { lineStyle: { color: '#30363d' } },
    }],
    series: [
      {
        name: 'externality（宏/私）',
        type: 'line',
        xAxisIndex: 0, yAxisIndex: 0,
        data: PERIODS.map((p, i) => [p, extData[i]]),
        connectNulls: false,
        lineStyle: { color: '#f0883e', width: 2.5 },
        itemStyle: { color: '#f0883e' },
        symbolSize: 7,
        markLine: {
          silent: false,
          symbol: ['none', 'none'],
          data: [
            { xAxis: '中唐', label: { formatter: '安史之乱 755', color: '#d29922', position: 'insideStartTop' }, lineStyle: { color: '#d29922', type: 'dashed' } },
            { xAxis: '南宋', label: { formatter: '靖康之变 1127', color: '#d29922', position: 'insideStartTop' }, lineStyle: { color: '#d29922', type: 'dashed' } },
          ],
        },
        markArea: { data: markAreaData, silent: true },
      },
      {
        name: '宏大意象',
        type: 'themeRiver',
        singleAxisIndex: 0,
        data: riverData.filter(d => d[2] === '宏大意象'),
        itemStyle: { color: '#E8B84B' },
        emphasis: { focus: 'series' },
        label: { show: false },
      },
      {
        name: '私人意象',
        type: 'themeRiver',
        singleAxisIndex: 0,
        data: riverData.filter(d => d[2] === '私人意象'),
        itemStyle: { color: '#8B7BB5' },
        emphasis: { focus: 'series' },
        label: { show: false },
      },
    ],
  }
}
