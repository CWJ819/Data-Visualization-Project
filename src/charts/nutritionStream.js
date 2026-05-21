// NutritionStream: stacked area chart for carbs/protein/fat
export function getNutritionOption(data) {
  if (!data?.length) return {}

  const dates = data.map(d => d.date)
  // Calculate percentage of total calories
  const carbsPct = data.map(d => +((d.carbs * 4) / d.calIn * 100).toFixed(1))
  const proteinPct = data.map(d => +((d.protein * 4) / d.calIn * 100).toFixed(1))
  const fatPct = data.map(d => +((d.fat * 9) / d.calIn * 100).toFixed(1))

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(0, 180, 216, 0.3)',
      formatter: (params) => {
        let html = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach(p => {
          html += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px"></span>`
          html += `${p.seriesName}: ${p.data}%<br/>`
        })
        return html
      },
    },
    legend: {
      data: ['碳水%', '蛋白质%', '脂肪%'],
      bottom: 0,
      textStyle: { color: '#8892a4', fontSize: 12 },
    },
    grid: { top: 10, left: 50, right: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#8892a4', fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: {
      type: 'value',
      name: '占比 (%)',
      max: 100,
      nameTextStyle: { color: '#00b4d8' },
      axisLabel: { color: '#8892a4' },
      splitLine: {
        lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' },
      },
    },
    color: ['#00d4aa', '#00b4d8', '#667eea'],
    series: [
      {
        name: '碳水%',
        type: 'line',
        data: carbsPct,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.6 },
        lineStyle: { width: 1 },
        symbol: 'none',
      },
      {
        name: '蛋白质%',
        type: 'line',
        data: proteinPct,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.6 },
        lineStyle: { width: 1 },
        symbol: 'none',
      },
      {
        name: '脂肪%',
        type: 'line',
        data: fatPct,
        smooth: true,
        stack: 'total',
        areaStyle: { opacity: 0.6 },
        lineStyle: { width: 1 },
        symbol: 'none',
      },
    ],
  }
}
