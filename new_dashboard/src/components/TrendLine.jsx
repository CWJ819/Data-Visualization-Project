import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

const TREND_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#2980b9', '#8e44ad', '#e84393', '#636e72',
  '#00b894', '#6c5ce7', '#fd79a8', '#00cec9', '#a29bfe', '#fab1a0',
]

export default function TrendLine({ data }) {
  const option = useMemo(() => {
    if (!data) return null

    const groups = Object.keys(data)
    const series = groups.map((group, i) => ({
      name: group,
      type: 'line',
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p =>
        data[group][String(p)] ?? 0
      ),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 1.5 },
    }))

    return {
      backgroundColor: '#f5f2eb',
      legend: {
        data: groups,
        top: 4,
        textStyle: { color: '#5a5a5a', fontSize: 10 },
        type: 'scroll',
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: '#cdc8aa',
        textStyle: { color: '#5a5a5a', fontSize: 11 },
      },
      grid: {
        top: 44,
        bottom: 30,
        left: 40,
        right: 20,
      },
      xAxis: {
        type: 'category',
        data: PHASE_NAMES,
        axisLabel: { color: '#7f97ae', fontSize: 8, interval: 0, rotate: -25 },
        axisLine: { lineStyle: { color: '#d4d5cf' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '次/百首',
        nameTextStyle: { color: '#7f97ae', fontSize: 9 },
        axisLabel: { color: '#7f97ae', fontSize: 9 },
        splitLine: { lineStyle: { color: '#e9e1d8' } },
      },
      series: series.map((s, i) => ({
        ...s,
        itemStyle: { color: TREND_COLORS[i % TREND_COLORS.length] },
      })),
    }
  }, [data])

  if (!option) return null
  return <ChartBox option={option} style={{ height: '100%' }} />
}
