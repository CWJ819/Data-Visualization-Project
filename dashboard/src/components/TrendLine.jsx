import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'
import { COLORS, TREND_COLORS } from '../theme.js'

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

const PHASE_LABELS = [
  '盛唐\n前期',
  '盛唐\n后期',
  '唐易代\n转折',
  '中唐\n前期',
  '中唐\n后期',
  '晚唐\n时期',
  '五代\n十国',
  '北宋\n前期',
  '北宋\n中期',
  '北宋\n晚期',
  '宋易代\n转折',
  '南宋\n中后期',
]

const EVENT_LINE_COLOR = '#A94B3D'

export default function TrendLine({ data, selectedImagery = [] }) {
  const option = useMemo(() => {
    if (!data) return null

    const groups = Object.keys(data)
    const activeSelected = selectedImagery.filter(group => groups.includes(group))
    const hasSelection = activeSelected.length > 0
    const groupsToShow = hasSelection ? activeSelected : groups

    const series = groupsToShow.map((group, i) => ({
      name: group,
      type: 'line',
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p =>
        data[group][String(p)] ?? 0
      ),
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { width: 2.5 },
      itemStyle: { color: TREND_COLORS[i % TREND_COLORS.length] },
      emphasis: {
        focus: 'series',
        lineStyle: { width: 3.5 },
      },
    }))

    const legendSelected = Object.fromEntries(
      groupsToShow.map(group => [group, hasSelection])
    )

    return {
      backgroundColor: 'transparent',
      legend: {
        data: groupsToShow,
        selected: legendSelected,
        top: 4,
        textStyle: { color: COLORS.ink, fontSize: 10 },
        type: 'scroll',
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        confine: true,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: COLORS.cardBorder,
        textStyle: { color: COLORS.ink, fontSize: 11 },
        extraCssText: 'border-radius:6px;box-shadow:0 8px 22px rgba(80,70,50,0.16);z-index:9999;',
      },
      grid: {
        top: 56,
        bottom: 46,
        left: 44,
        right: 24,
      },
      xAxis: {
        type: 'category',
        data: PHASE_NAMES,
        axisLabel: {
          color: COLORS.inkSoft,
          fontSize: 9,
          interval: 0,
          rotate: 0,
          lineHeight: 13,
          formatter: (_, idx) => PHASE_LABELS[idx] ?? '',
        },
        axisLine: { lineStyle: { color: 'rgba(120,100,60,0.24)' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '次/百首',
        nameTextStyle: { color: COLORS.inkSoft, fontSize: 9 },
        axisLabel: { color: COLORS.inkSoft, fontSize: 9 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(120,100,60,0.14)' } },
      },
      series: [
        ...series,
        {
          name: '__historical_events__',
          type: 'line',
          data: new Array(PHASE_NAMES.length).fill(null),
          symbol: 'none',
          silent: true,
          tooltip: { show: false },
          lineStyle: { opacity: 0 },
          markLine: {
            symbol: 'none',
            silent: true,
            lineStyle: {
              color: EVENT_LINE_COLOR,
              width: 1,
              type: 'solid',
              opacity: 0.78,
            },
            label: {
              show: true,
              position: 'insideEndTop',
              formatter: (params) => params.name,
              color: EVENT_LINE_COLOR,
              fontSize: 10,
              fontFamily: 'KaiTi, STKaiti, serif',
              lineHeight: 13,
              backgroundColor: 'rgba(245,235,211,0.72)',
              borderRadius: 3,
              padding: [2, 4],
            },
            data: [
              { name: '755 CE\nAn Lushan\nRebellion', xAxis: '唐易代转折期' },
              { name: '1127 CE\nJingkang\nIncident', xAxis: '宋易代转折期' },
            ],
          },
        },
      ],
    }
  }, [data, selectedImagery])

  if (!option) return null
  return <ChartBox option={option} style={{ height: '100%' }} />
}
