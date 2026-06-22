import { useMemo, useRef, useEffect } from 'react'
import echarts from '../charts.js'
import { COLORS, WORD_COLORS } from '../theme.js'

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

function getPeakPhase(trendData, name) {
  const values = trendData?.[name]
  if (!values) return null

  let peakPhase = null
  let peakValue = -Infinity
  for (const [phase, rawValue] of Object.entries(values)) {
    const value = Number(rawValue || 0)
    if (value > peakValue) {
      peakValue = value
      peakPhase = Number(phase)
    }
  }

  if (!peakPhase || peakValue <= 0) return null
  return {
    label: PHASE_NAMES[peakPhase - 1] ?? `阶段 ${peakPhase}`,
    value: peakValue,
  }
}

export default function WordCloud({
  data,
  trendData,
  onToggleImagery,
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const roRef = useRef(null)
  // 始终持有最新回调，避免将其加入 effect 依赖
  const onToggleImageryRef = useRef(onToggleImagery)
  useEffect(() => { onToggleImageryRef.current = onToggleImagery })

  const option = useMemo(() => {
    if (!data || data.length === 0) return null
    const rankByName = new Map(data.map((item, index) => [item.name, index + 1]))

    // 颜色内嵌到每个 item，避免系列级 color 函数在 highlight 时被重算触发重排
    const coloredData = data.map((item, i) => ({
      ...item,
      textStyle: { color: WORD_COLORS[i % WORD_COLORS.length] },
    }))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        appendToBody: true,
        confine: true,
        formatter: (p) => {
          const peak = getPeakPhase(trendData, p.name)
          const lines = [
            `<strong>${p.name}</strong>`,
            `当前范围：${p.value} 次`,
            `当前排名：第 ${rankByName.get(p.name) ?? '-'} 位`,
          ]
          if (peak) {
            lines.push(`全阶段峰值：${peak.label}（${peak.value} 次/百首）`)
          }
          return lines.join('<br/>')
        },
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: COLORS.cardBorder,
        textStyle: { color: COLORS.ink },
        extraCssText: 'border-radius:6px;box-shadow:0 8px 22px rgba(80,70,50,0.16);z-index:9999;',
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        width: '90%',
        height: '90%',
        sizeRange: [14, 52],
        rotationRange: [-20, 20],
        rotationStep: 20,
        gridSize: 6,
        drawOutOfBound: false,
        layoutAnimation: false,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
        },
        emphasis: {
          focus: 'none',  // 阻断 blur 级联，防止批量状态更新触发重排
          textStyle: {
            color: COLORS.ochre,
            shadowBlur: 4,
            shadowColor: 'rgba(80,70,50,0.22)',
          },
        },
        data: coloredData,
      }],
    }
  }, [data, trendData])

  // option 变化时仅调用 setOption，不销毁重建实例
  useEffect(() => {
    if (!option) {
      // 数据清空时才销毁
      if (chartRef.current) {
        roRef.current?.disconnect()
        chartRef.current.dispose()
        chartRef.current = null
        roRef.current = null
      }
      return
    }

    const container = containerRef.current
    if (!container) return

    // 首次或销毁后才初始化实例
    if (!chartRef.current) {
      const chart = echarts.init(container, null, { renderer: 'canvas' })
      chartRef.current = chart
      chart.on('click', (params) => {
        if (params?.name) onToggleImageryRef.current?.(params.name)
      })
      const ro = new ResizeObserver(() => chart.resize())
      ro.observe(container)
      roRef.current = ro
    }

    // 复用已有实例，避免词云重新排列
    chartRef.current.setOption(option, true)
  }, [option]) // 不依赖 onToggleImagery，通过 ref 拿最新值

  // 组件卸载时统一清理
  useEffect(() => {
    return () => {
      roRef.current?.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
      roRef.current = null
    }
  }, [])

  if (!option || !data || data.length === 0) {
    return <div className="chart-placeholder">当前范围内无意象数据</div>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
