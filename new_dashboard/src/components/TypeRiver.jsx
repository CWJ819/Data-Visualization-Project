import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'
import { COLORS, RIVER_COLORS } from '../theme.js'

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

// 每个阶段对应一个代表年份（仅用于 ThemeRiver 时间轴定位）
const PHASE_YEARS = [713, 750, 765, 790, 820, 870, 935, 1010, 1070, 1115, 1145, 1220]

export default function TypeRiver({ data }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return null

    const seriesData = data.map(d => [d[0], d[1], d[2]])

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        confine: true,
        formatter: (params) => {
          const name = params.value ? params.value[2] : ''
          return `<span style="font-weight:600;color:${COLORS.ink};font-size:13px;">${name}</span>`
        },
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: COLORS.cardBorder,
        textStyle: { color: COLORS.ink, fontSize: 13 },
        extraCssText: 'border-radius:6px;box-shadow:0 8px 22px rgba(80,70,50,0.16);z-index:9999;',
      },
      singleAxis: {
        type: 'value',
        min: 1,
        max: 12,
        interval: 1,
        bottom: 60,
        axisLabel: {
          color: COLORS.stoneBlue,
          fontSize: 9,
          rotate: -30,
          formatter: (v) => {
            const idx = Math.round(v) - 1
            return idx >= 0 && idx < PHASE_NAMES.length ? PHASE_NAMES[idx] : ''
          },
        },
      },
      series: [{
        type: 'themeRiver',
        data: seriesData,
        color: RIVER_COLORS.slice(0, 8),
        itemStyle: {
          opacity: 0.78,
        },
        emphasis: {
          itemStyle: {
            opacity: 0.94,
          },
        },
      }],
    }
  }, [data])

  if (!option) return null
  return <ChartBox option={option} style={{ height: '100%' }} />
}
