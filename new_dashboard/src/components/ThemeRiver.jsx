import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'

const THEME_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#2980b9', '#8e44ad',
  '#e84393', '#636e72', '#00b894', '#6c5ce7',
]

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '安史之乱', '大历贞元',
  '元和文坛', '晚唐', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '南渡', '南宋中后期',
]

const PHASE_YEARS = [713, 750, 765, 790, 820, 870, 935, 1010, 1070, 1115, 1145, 1220]

export default function ThemeRiver({ data }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return null

    const seriesData = data.map(d => {
      const year = PHASE_YEARS[d[0] - 1]
      return [String(year), d[1], d[2]]
    })

    return {
      backgroundColor: '#161b22',
      singleAxis: {
        type: 'time',
        bottom: 30,
        axisLabel: {
          color: '#aaa',
          fontSize: 11,
          formatter: (v) => {
            const dt = new Date(v)
            const idx = PHASE_YEARS.indexOf(dt.getFullYear())
            return idx >= 0 ? PHASE_NAMES[idx] : ''
          },
          interval: 0,
          rotate: -25,
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
