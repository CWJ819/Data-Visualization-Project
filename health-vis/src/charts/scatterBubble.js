export function getScatterOption(data) {
  if (!data?.length) return {}

  const points = []
  for (let i = 1; i < data.length; i++) {
    points.push({
      value: [
        data[i].calDiff,
        +(data[i].weight - data[i - 1].weight).toFixed(3),
        data[i].sleepQuality,
        data[i].date,
      ],
    })
  }

  const xs = points.map(p => p.value[0])
  const ys = points.map(p => p.value[1])
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2 }
  const slope = den ? num / den : 0
  const intercept = meanY - slope * meanX
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const trendLine = [[xMin, slope * xMin + intercept], [xMax, slope * xMax + intercept]]

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(241, 196, 15, 0.3)',
      formatter: (p) => {
        const [x, y, sq, date] = p.data.value
        return `<strong>${date}</strong><br/>热量差: ${x} kcal<br/>体重变化: ${y > 0 ? '+' : ''}${y}kg<br/>睡眠质量: ${sq}/10`
      },
    },
    grid: { top: 10, left: 55, right: 20, bottom: 40 },
    xAxis: {
      type: 'value',
      name: '热量差 (kcal)',
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: '#f1c40f' },
      axisLabel: { color: '#ffffff' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    yAxis: {
      type: 'value',
      name: '体重变化 (kg)',
      nameTextStyle: { color: '#2ecc71' },
      axisLabel: { color: '#ffffff' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: [
      {
        type: 'scatter',
        data: points,
        symbolSize: (val) => Math.max(4, val[2] * 2),
        itemStyle: {
          color: (p) => p.data.value[0] > 0 ? '#f1c40f' : '#2ecc71',
          opacity: 0.7,
        },
        emphasis: {
          scale: 1.5,
          itemStyle: { opacity: 1 },
        },
      },
      {
        type: 'line',
        data: trendLine,
        silent: true,
        lineStyle: { color: '#ffffff', width: 1, type: 'dashed' },
        symbol: 'none',
      },
    ],
  }
}
