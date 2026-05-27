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
      borderColor: 'rgba(46, 204, 113, 0.3)',
    },
    color:['#f1c40f'],
    legend: {
      data: ['体重(kg)', '热量差(kcal)', '摄入', '消耗'],
      bottom: 0,
      textStyle: { color: '#ecf0f1', fontSize: 12 },
    },
    grid: { top: 10, left: 50, right: 50, bottom: 80 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#ecf0f1', fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '体重 (kg)',
        nameTextStyle: { color: '#2ecc71' },
        axisLabel: { color: '#ecf0f1' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: '热量差 (kcal)',
        nameTextStyle: { color: '#f1c40f' },
        axisLabel: { color: '#ffffff' },
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
        lineStyle: { color: '#2ecc71', width: 2.5 },
        itemStyle: { color: '#2ecc71' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(46, 204, 113, 0.3)' },
              { offset: 1, color: 'rgba(46, 204, 113, 0.02)' },
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
          color: (p) => p.data > 0 ? '#f1c40f' : '#2ecc71',
          borderRadius: [2, 2, 0, 0],
        },
        barWidth: '60%',
      },
      {
        name: '摄入',
        type: 'line',
        data: calIns,
        yAxisIndex: 1,
        lineStyle: { color: '#e67e22', width: 1, type: 'dashed' },
        itemStyle: { color: '#e67e22' },
        symbol: 'none',
      },
      {
        name: '消耗',
        type: 'line',
        data: calOuts,
        yAxisIndex: 1,
        lineStyle: { color: '#f1c40f', width: 1, type: 'dashed' },
        itemStyle: { color: '#f1c40f' },
        symbol: 'none',
      },
    ],
  }
}
