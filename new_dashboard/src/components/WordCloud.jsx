import { useMemo, useRef, useEffect } from 'react'
import echarts from '../charts.js'

function randomColor() {
  const hues = [0, 20, 200, 220, 240, 300, 340]
  const h = hues[Math.floor(Math.random() * hues.length)]
  return `hsl(${h}, 70%, 55%)`
}

export default function WordCloud({ data }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  const option = useMemo(() => {
    if (!data || data.length === 0) return null

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (p) => `${p.name}: ${p.value} 次`,
        backgroundColor: '#1e1e1e',
        borderColor: '#444',
        textStyle: { color: '#eee' },
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        width: '90%',
        height: '90%',
        sizeRange: [12, 50],
        rotationRange: [-20, 20],
        rotationStep: 20,
        gridSize: 6,
        drawOutOfBound: false,
        layoutAnimation: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => randomColor(),
        },
        data,
      }],
    }
  }, [data])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !option) return

    const chart = echarts.init(container, null, { renderer: 'canvas' })
    chartRef.current = chart
    chart.setOption(option, true)

    let resizeTimer
    const ro = new ResizeObserver(() => {
      chart.resize()
      // 容器尺寸变化后，重新 setOption 触发 wordcloud 重新布局
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        chart.setOption(option, true)
      }, 100)
    })
    ro.observe(container)

    return () => {
      clearTimeout(resizeTimer)
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [option])

  if (!option || data.length === 0) {
    return <div className="chart-placeholder">当前范围内无意象数据</div>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
