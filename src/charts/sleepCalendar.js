// SleepCalendar: calendar heatmap + bar chart for sleep
export function getSleepOption(data) {
  if (!data?.length) return {}

  const dates = data.map(d => d.date)
  const sleepHours = data.map(d => d.sleepHours)
  const sleepQuality = data.map(d => d.sleepQuality)

  // Calendar heatmap data format: [[date, value], ...]
  const calendarData = data.map(d => [d.date, d.sleepQuality])

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(102, 126, 234, 0.3)',
    },
    legend: {
      data: ['睡眠时长(h)', '睡眠质量'],
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
        name: '小时',
        min: 0,
        max: 12,
        nameTextStyle: { color: '#667eea' },
        axisLabel: { color: '#8892a4' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: '质量分',
        min: 0,
        max: 10,
        nameTextStyle: { color: '#764ba2' },
        axisLabel: { color: '#8892a4' },
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
            if (h >= 8) return '#00d4aa'  // good sleep
            if (h >= 6) return '#ffa500'  // fair
            return '#ff6b6b'              // poor
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
        lineStyle: { color: '#764ba2', width: 2 },
        itemStyle: { color: '#764ba2' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(118, 75, 162, 0.25)' },
              { offset: 1, color: 'rgba(118, 75, 162, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
      },
    ],
  }
}
