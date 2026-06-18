import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'

const TYPE_COLORS = [
  '#e74c3c', '#e67e22', '#2ecc71', '#1abc9c',
  '#3498db', '#e84393', '#9b59b6', '#636e72',
]

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '安史之乱', '大历贞元',
  '元和文坛', '晚唐', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '南渡', '南宋中后期',
]

// 每个阶段对应一个代表年份（仅用于 ThemeRiver 时间轴定位）
const PHASE_YEARS = [713, 750, 765, 790, 820, 870, 935, 1010, 1070, 1115, 1145, 1220]

export default function TypeRiver({ data }) {
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
        color: TYPE_COLORS,
      }],
    }
  }, [data])

  if (!option) return null
  return <ChartBox option={option} style={{ height: 320 }} />
}
