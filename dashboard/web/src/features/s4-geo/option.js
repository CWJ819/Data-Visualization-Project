/**
 * 纯函数：构建 S4 地理地图 option。
 * china.json 注册由组件负责（只注册一次），此处只构建 option。
 */
export function buildGeoOption(geoData, selectedPeriod) {
  if (!geoData) return null

  let places = []
  if (selectedPeriod && geoData.by_period[selectedPeriod]) {
    places = geoData.by_period[selectedPeriod]
  } else {
    // 合并唐宋总体
    const all = {}
    Object.values(geoData.by_dynasty || {}).forEach(arr => {
      arr.forEach(p => {
        if (!all[p.name]) all[p.name] = { ...p, count: 0 }
        all[p.name].count += p.count
      })
    })
    places = Object.values(all)
  }

  const maxCount = Math.max(...places.map(p => p.count), 1)

  return {
    backgroundColor: '#0d1117',
    geo: {
      map: 'china',
      roam: true,
      itemStyle: { areaColor: '#161b22', borderColor: '#30363d', borderWidth: 0.8 },
      emphasis: { itemStyle: { areaColor: '#21262d' } },
      zoom: 1.1,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#161b22', borderColor: '#30363d',
      textStyle: { color: '#e6edf3' },
      formatter: p => `${p.data?.name}<br/>出现 ${p.data?.count} 次`,
    },
    visualMap: {
      min: 1, max: maxCount,
      inRange: { color: ['#1f3a5f', '#4a9e8e', '#e8d5a3'] },
      textStyle: { color: '#8b949e' },
      orient: 'vertical', right: 16, bottom: 40,
    },
    series: [{
      type: 'scatter',
      coordinateSystem: 'geo',
      data: places.map(p => ({
        name: p.name,
        value: [p.lng, p.lat, p.count],
        count: p.count,
        symbolSize: Math.sqrt(p.count / maxCount) * 40 + 6,
      })),
      itemStyle: { color: '#4a9e8e', opacity: 0.85 },
      emphasis: { itemStyle: { color: '#e8d5a3' } },
    }],
  }
}
