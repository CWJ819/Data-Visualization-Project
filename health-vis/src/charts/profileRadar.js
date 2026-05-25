// ProfileRadar: multi-dimensional health profile
export function getRadarOption(profileData) {
  if (!profileData) return {}

  // Normalize each dimension to 0-100 scale for radar comparison
  const norm = (val, min, max) => max === min ? 50 : +((val - min) / (max - min) * 100).toFixed(0)

  // Typical ranges for each metric
  const ranges = {
    weight: [50, 100],
    calIn: [1500, 3000],
    calOut: [1500, 3000],
    sleepHours: [4, 10],
    sleepQuality: [1, 10],
    carbs: [150, 400],
    protein: [50, 200],
    fat: [30, 120],
  }

  const indicators = [
    { name: '体重', key: 'weight' },
    { name: '摄入热量', key: 'calIn' },
    { name: '消耗热量', key: 'calOut' },
    { name: '睡眠时长', key: 'sleepHours' },
    { name: '睡眠质量', key: 'sleepQuality' },
    { name: '碳水摄入', key: 'carbs' },
  ]

  const radarIndicators = indicators.map(d => ({ name: d.name, max: 100 }))
  const values = indicators.map(d => {
    const [min, max] = ranges[d.key] || [0, 100]
    return norm(profileData[d.key], min, max)
  })

  return {
    tooltip: {
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(0, 180, 216, 0.3)',
      formatter: (p) => {
        const idx = p.dataIndex
        const key = indicators[idx].key
        return `${indicators[idx].name}: <strong>${profileData[key]}</strong>`
      },
    },
    legend: { show: false },
    radar: {
      indicator: radarIndicators,
      center: ['50%', '50%'],
      radius: '65%',
      axisName: { color: '#5892a4', fontSize: 11 },
      shape: 'circle',
      splitNumber: 5,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(0, 212, 170, 0.05)', 'rgba(0, 180, 216, 0.05)'],
        },
      },
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: '当前画像' }],
      areaStyle: { color: 'rgba(0, 212, 170, 0.2)' },
      lineStyle: { color: '#00d4aa', width: 2 },
      itemStyle: { color: '#00d4aa' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  }
}
