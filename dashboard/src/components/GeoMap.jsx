import { useMemo, useEffect, useState, useRef } from 'react'
import echarts from '../charts.js'
import { COLORS } from '../theme.js'

let chinaRegistered = false

export default function GeoMap({ data, selectedPhase }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // 注册中国地图（只一次）
  useEffect(() => {
    if (chinaRegistered) {
      console.log('[GeoMap] 地图已注册')
      setMapReady(true)
      return
    }
    fetch('/map/china.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        echarts.registerMap('china', json)
        chinaRegistered = true
        console.log('[GeoMap] 地图注册成功')
        setMapReady(true)
      })
      .catch(e => console.warn('[GeoMap] china.json 加载失败', e))
  }, [])

  const option = useMemo(() => {
    if (!mapReady || !data) {
      console.log('[GeoMap] 暂未就绪:', { mapReady, hasData: !!data })
      return null
    }

    const byPhase = data.by_phase
    const coords = data.place_coords

    const merged = {}
    if (selectedPhase != null) {
      const phaseData = byPhase[String(selectedPhase)]
      if (phaseData) {
        for (const [place, count] of Object.entries(phaseData)) {
          merged[place] = (merged[place] || 0) + count
        }
      }
    } else {
      for (let p = 1; p <= 12; p++) {
        const phaseData = byPhase[String(p)]
        if (!phaseData) continue
        for (const [place, count] of Object.entries(phaseData)) {
          merged[place] = (merged[place] || 0) + count
        }
      }
    }

    const placeEntries = Object.entries(merged)
    console.log('[GeoMap] 地名数:', placeEntries.length)

    const base = {
      backgroundColor: 'transparent',
      geo: {
        map: 'china',
        roam: true,
        itemStyle: {
          areaColor: 'rgba(232, 221, 200, 0.58)',
          borderColor: 'rgba(120, 100, 60, 0.28)',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: { areaColor: COLORS.neutralSoft },
        },
        zoom: 1.1,
      },
      series: [],
    }

    if (placeEntries.length === 0) return base

    const counts = placeEntries.map(([, c]) => c)
    const maxCount = Math.max(...counts, 1)

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        confine: true,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: COLORS.cardBorder,
        textStyle: { color: COLORS.ink, fontSize: 12 },
        extraCssText: 'border-radius:6px;box-shadow:0 8px 22px rgba(80,70,50,0.16);z-index:9999;',
        formatter: (p) => {
          const d = p.data
          return d ? `<b>${d.name}</b><br/>出现 ${d.count} 次` : ''
        },
      },
      visualMap: {
        min: 1,
        max: maxCount,
        inRange: { color: [COLORS.neutral, COLORS.stoneBlueSoft, COLORS.stoneBlueDeep] },
        textStyle: { color: COLORS.stoneBlue },
        orient: 'vertical',
        right: 12,
        bottom: 40,
        calculable: true,
      },
      series: [{
        type: 'scatter',
        coordinateSystem: 'geo',
        data: placeEntries.map(([name, count]) => {
          const coord = coords[name]
          if (!coord) return null
          return {
            name,
            value: [coord[0], coord[1], count],
            count,
            symbolSize: Math.sqrt(count / maxCount) * 40 + 8,
          }
        }).filter(Boolean),
        itemStyle: { color: COLORS.stoneBlue, opacity: 0.84 },
        emphasis: {
          itemStyle: { color: COLORS.gold },
          scale: 1.5,
        },
      }],
    }
  }, [data, selectedPhase, mapReady])

  // 初始化图表
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    console.log('[GeoMap] 初始化图表')
    const chart = echarts.init(container, null, { renderer: 'canvas' })
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(container)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  // 更新 option
  useEffect(() => {
    if (chartRef.current && option) {
      console.log('[GeoMap] 设置 option')
      chartRef.current.setOption(option, true)
      chartRef.current.resize()
    }
  }, [option])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!mapReady && <div className="chart-placeholder">加载地图中...</div>}
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 200, display: mapReady ? 'block' : 'none' }} />
    </div>
  )
}
