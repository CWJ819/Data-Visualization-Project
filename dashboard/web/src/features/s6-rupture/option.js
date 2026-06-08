/** 纯函数：构建单个断面的 before/after 双柱 option */
export function buildRuptureBarOption(ruptureData) {
  if (!ruptureData) return null
  const { before, after, before_period, after_period } = ruptureData

  const metrics = [
    { key: 'sentiment',       label: '情感分',      fmt: v => v?.toFixed(3) },
    { key: 'externality_index', label: 'externality', fmt: v => v?.toFixed(3) ?? 'null' },
    { key: 'macro_per_1k',   label: '宏大/千字',   fmt: v => v?.toFixed(1) },
    { key: 'private_per_1k', label: '私人/千字',   fmt: v => v?.toFixed(1) },
  ]

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#161b22', borderColor: '#30363d', textStyle: { color: '#e6edf3' } },
    legend: {
      data: [before_period, after_period], top: 4,
      textStyle: { color: '#8b949e', fontSize: 12 },
    },
    grid: { top: 32, bottom: 36, left: 80, right: 16 },
    xAxis: { type: 'value', axisLabel: { color: '#8b949e' }, splitLine: { lineStyle: { color: '#21262d' } } },
    yAxis: {
      type: 'category',
      data: metrics.map(m => m.label),
      axisLabel: { color: '#c9d1d9', fontSize: 12 },
    },
    series: [
      {
        name: before_period,
        type: 'bar', barMaxWidth: 18,
        data: metrics.map(m => before?.[m.key] ?? 0),
        itemStyle: { color: '#5B8DB8' },
        label: { show: true, position: 'right', color: '#8b949e', fontSize: 11,
                 formatter: p => metrics[p.dataIndex].fmt(p.value) },
      },
      {
        name: after_period,
        type: 'bar', barMaxWidth: 18,
        data: metrics.map(m => after?.[m.key] ?? 0),
        itemStyle: { color: '#4A9E8E' },
        label: { show: true, position: 'right', color: '#8b949e', fontSize: 11,
                 formatter: p => metrics[p.dataIndex].fmt(p.value) },
      },
    ],
  }
}
