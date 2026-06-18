import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'

const THEME_COLORS = [
  '#7f97ae', '#99a5c0', '#cdc8aa', '#e2ced0',
  '#bfbea8', '#bbcadc', '#e9e1d8', '#e1d6db',
  '#d4d5cf', '#c6b9a3', '#d7c6d9', '#a6b7a2',
]

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

const PHASE_YEARS = [713, 750, 765, 790, 820, 870, 935, 1010, 1070, 1115, 1145, 1220]

export default function ThemeRiver({ data }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return null

    const seriesData = data.map(d => [d[0], d[1], d[2]])

    return {
      backgroundColor: '#f5f2eb',
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const name = params.value ? params.value[2] : ''
          return `<span style="font-weight:600;color:#5a5a5a;font-size:13px;">${name}</span>`
        },
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: '#cdc8aa',
        textStyle: { color: '#5a5a5a', fontSize: 13 },
      },
      singleAxis: {
        type: 'value',
        min: 1,
        max: 12,
        interval: 1,
        bottom: 60,
        axisLabel: {
          color: '#7f97ae',
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
        color: THEME_COLORS,
      }],
    }
  }, [data])

  if (!option) return null
  return <ChartBox option={option} style={{ height: 320 }} />
}
