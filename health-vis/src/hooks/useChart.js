import { useEffect, useRef, useCallback } from 'react'
import * as echarts from 'echarts'

export default function useChart(option, deps = []) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)

  // Init chart on mount
  useEffect(() => {
    if (!containerRef.current) return

    instanceRef.current = echarts.init(containerRef.current, null, {
      renderer: 'canvas',
    })

    const handleResize = () => {
      try { instanceRef.current?.resize() } catch (_) { /* disposed */ }
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  // Update chart when options change
  useEffect(() => {
    if (!instanceRef.current || instanceRef.current.isDisposed()) return
    instanceRef.current.setOption(option, { notMerge: true })
  }, [option])

  // Return chart instance for event binding
  const getInstance = useCallback(() => instanceRef.current, [])

  return { containerRef, getInstance }
}
