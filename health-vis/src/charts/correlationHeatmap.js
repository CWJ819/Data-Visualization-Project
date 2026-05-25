// CorrelationHeatmap: Pearson correlation matrix
export function getHeatmapOption({ matrix, labels }) {
  if (!matrix?.length || !labels?.length) return {}

  const data = []
  for (let i = 0; i < labels.length; i++) {
    for (let j = 0; j < labels.length; j++) {
      data.push([j, i, matrix[i][j]])
    }
  }

  const labelMap = {
    weight: '体重', calIn: '摄入热量', calOut: '消耗热量',
    calDiff: '热量差', carbs: '碳水', protein: '蛋白质',
    fat: '脂肪', sleepHours: '睡眠时长', sleepQuality: '睡眠质量',
  }

  return {
    tooltip: {
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(102, 126, 234, 0.3)',
      formatter: (p) => {
        const [x, y, v] = p.data
        return `${labelMap[labels[y]]} vs ${labelMap[labels[x]]}<br/>r = <strong>${v.toFixed(3)}</strong>`
      },
    },
    grid: { top: 5, left: 80, right: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: labels.map(l => labelMap[l] || l),
      axisLabel: { color: '#8892a4', fontSize: 10, rotate: 45 },
      position: 'bottom',
    },
    yAxis: {
      type: 'category',
      data: labels.map(l => labelMap[l] || l),
      axisLabel: { color: '#8892a4', fontSize: 10 },
    },
    visualMap: {
      min: -1, max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center', bottom: 0,
      inRange: { color: ['#667eea', '#1a2540', '#ff6b6b'] },
      textStyle: { color: '#8892a4' },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: true, color: '#e0e6ed', fontSize: 10 },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 212, 170, 0.5)' },
      },
    }],
  }
}
