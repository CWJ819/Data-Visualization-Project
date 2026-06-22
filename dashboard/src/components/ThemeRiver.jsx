import { useMemo } from 'react'
import ChartBox from './ChartBox.jsx'
import RiverGuidesOverlay from './RiverGuidesOverlay.jsx'
import { createRiverGuides, getRiverGuideValues } from './riverGuides.js'
import { COLORS, RIVER_COLORS } from '../theme.js'

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

const PHASE_YEARS = [713, 750, 765, 790, 820, 870, 935, 1010, 1070, 1115, 1145, 1220]

export default function ThemeRiver({ data }) {
  const chart = useMemo(() => {
    if (!data || data.length === 0) return null

    const seriesData = data.map(d => [d[0], d[1], d[2]])

    const categories = [...new Set(seriesData.map(d => d[2]))]
    const guideValues = getRiverGuideValues(seriesData, categories)

    const guides = createRiverGuides(categories, RIVER_COLORS, {
      startPercent: 8,
      endPercent: 74,
      fontSize: 9,
      labelColor: COLORS.ink,
      values: guideValues,
      minGapPercent: 4.8,
    })

    return {
      guides,
      option: {
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
          top: 0,
          bottom: 42,
          axisLine: { lineStyle: { color: 'rgba(120,100,60,0.24)' } },
          axisTick: { lineStyle: { color: 'rgba(120,100,60,0.24)' } },
          axisLabel: {
            color: COLORS.inkSoft,
            fontSize: 9,
            interval: 0,
            rotate: 0,
            lineHeight: 13,
            margin: 4,
            formatter: (v) => {
              const idx = Math.round(v) - 1
              return idx >= 0 && idx < PHASE_LABELS.length ? PHASE_LABELS[idx] : ''
            },
          },
          splitLine: { show: false },
        },
        series: [{
          type: 'themeRiver',
          data: seriesData,
          color: RIVER_COLORS,
          label: { show: false },
          itemStyle: {
            opacity: 0.78,
          },
          emphasis: {
            label: { show: false },
            itemStyle: {
              opacity: 0.94,
            },
          },
        }],
      },
    }
  }, [data])

  if (!chart) return null
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ChartBox option={chart.option} style={{ height: '100%' }} />
      <RiverGuidesOverlay guides={chart.guides} />
    </div>
  )
}
