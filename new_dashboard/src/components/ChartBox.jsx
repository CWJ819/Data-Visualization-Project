import { useRef, useEffect } from 'react'
import echarts from '../charts.js'

export default function ChartBox({ option, style = {}, onEvents = {} }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = echarts.init(container, null, { renderer: 'canvas' })
    chartRef.current = chart

    for (const [name, handler] of Object.entries(onEvents)) {
      chart.on(name, handler)
    }

    const observer = new ResizeObserver(() => {
      chart.resize()
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (chartRef.current && option) {
      try {
        chartRef.current.setOption(option, true)
        requestAnimationFrame(() => chartRef.current?.resize())
      } catch (e) {
        console.error('[ChartBox] setOption error:', e)
      }
    }
  }, [option])

  return <div ref={containerRef} style={{ width: '100%', ...style }} />
}
