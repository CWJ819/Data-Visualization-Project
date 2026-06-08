import { useRef, useEffect } from 'react'
import echarts from '../../echarts'

/**
 * 通用 ECharts 容器。
 * init-once 模式：挂载时初始化一次，option 变化只调 setOption，不重建实例。
 */
export function ChartBox({ option, style, className, onEvents }) {
  const domRef  = useRef(null)
  const chartRef = useRef(null)

  // ── 初始化（只跑一次）──────────────────────────
  useEffect(() => {
    const chart = echarts.init(domRef.current)
    chartRef.current = chart

    if (onEvents) {
      Object.entries(onEvents).forEach(([evt, fn]) => chart.on(evt, fn))
    }

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(domRef.current)

    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── option 更新（不重建）──────────────────────
  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, { notMerge: true })
    }
  }, [option])

  return (
    <div
      ref={domRef}
      className={className}
      style={{ width: '100%', height: 400, ...style }}
    />
  )
}
