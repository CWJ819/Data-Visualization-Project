// WeightTrend: dual-axis line(weight) + bar(calDiff)
export function getWeightTrendOption(data) {
  if (!data?.length) return {}

  const dates = data.map(d => d.date)
  const weights = data.map(d => d.weight)
  const calDiffs = data.map(d => d.calDiff)
  const calIns = data.map(d => d.calIn)
  const calOuts = data.map(d => d.calOut)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(0, 212, 170, 0.3)',
    },
    legend: {
      data: ['体重(kg)', '热量差(kcal)', '摄入', '消耗'],
      bottom: 0,
      textStyle: { color: '#8892a4', fontSize: 12 },
    },
    grid: { top: 10, left: 50, right: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8892a4', fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '体重 (kg)',
        nameTextStyle: { color: '#00d4aa' },
        axisLabel: { color: '#8892a4' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: '热量差 (kcal)',
        nameTextStyle: { color: '#ff6b6b' },
        axisLabel: { color: '#8892a4' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '体重(kg)',
        type: 'line',
        data: weights,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { color: '#00d4aa', width: 2.5 },
        itemStyle: { color: '#00d4aa' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 170, 0.3)' },
              { offset: 1, color: 'rgba(0, 212, 170, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
      },
      {
        name: '热量差(kcal)',
        type: 'bar',
        data: calDiffs,
        yAxisIndex: 1,
        itemStyle: {
          color: (p) => p.data > 0 ? '#ff6b6b' : '#00d4aa',
          borderRadius: [2, 2, 0, 0],
        },
        barWidth: '60%',
      },
      {
        name: '摄入',
        type: 'line',
        data: calIns,
        yAxisIndex: 1,
        lineStyle: { color: '#ffa500', width: 1, type: 'dashed' },
        itemStyle: { color: '#ffa500' },
        symbol: 'none',
      },
      {
        name: '消耗',
        type: 'line',
        data: calOuts,
        yAxisIndex: 1,
        lineStyle: { color: '#ff6b6b', width: 1, type: 'dashed' },
        itemStyle: { color: '#ff6b6b' },
        symbol: 'none',
      },
    ],
  }
}
