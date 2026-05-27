export function getSleepOption(data) {
  if (!data?.length) return {}

  const dates = data.map(d => d.date)
  const sleepHours = data.map(d => d.sleepHours)
  const sleepQuality = data.map(d => d.sleepQuality)

  const calendarData = data.map(d => [d.date, d.sleepQuality])

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(52, 152, 219, 0.3)',
    },
    color:['#f1c40f'],
    legend: {
      data: ['睡眠时长(h)', '睡眠质量'],
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
        name: '小时',
        min: 0,
        max: 12,
        nameTextStyle: { color: '#3498db' },
        axisLabel: { color: '#ecf0f1' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: '质量分',
        min: 0,
        max: 10,
        nameTextStyle: { color: '#85c1e9' },
        axisLabel: { color: '#ecf0f1' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '睡眠时长(h)',
        type: 'bar',
        data: sleepHours,
        yAxisIndex: 0,
        itemStyle: {
          color: (p) => {
            const h = p.data
            if (h >= 8) return '#2ecc71'
            if (h >= 6) return '#f1c40f'
            return '#e74c3c'
          },
          borderRadius: [3, 3, 0, 0],
        },
        barWidth: '60%',
      },
      {
        name: '睡眠质量',
        type: 'line',
        data: sleepQuality,
        yAxisIndex: 1,
        lineStyle: { color: '#ffffff', width: 2 },
        itemStyle: { color: '#ffffff' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52, 152, 219, 0.25)' },
              { offset: 1, color: 'rgba(52, 152, 219, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
      },
    ],
  }
}
