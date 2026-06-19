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

  const option = useMemo(() => {
    if (!data || data.length === 0) return null
    const rankByName = new Map(data.map((item, index) => [item.name, index + 1]))

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
          color: (params = {}) => WORD_COLORS[(params.dataIndex ?? 0) % WORD_COLORS.length],
        },
        emphasis: {
          textStyle: {
            color: COLORS.ochre,
            shadowBlur: 4,
            shadowColor: 'rgba(80,70,50,0.22)',
          },
        },
        data,
      }],
    }
  }, [data, trendData])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !option) return

    const chart = echarts.init(container, null, { renderer: 'canvas' })
    chartRef.current = chart
    chart.setOption(option, true)
    chart.on('click', (params) => {
      if (params?.name) onToggleImagery?.(params.name)
    })

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
  }, [option, onToggleImagery])

  if (!option || data.length === 0) {
    return <div className="chart-placeholder">当前范围内无意象数据</div>
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
