import { useMemo } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { buildImageryOption } from './option'

export function S2Imagery() {
  const { data: imgData } = useData('imagery_flow')
  const { selectedPeriod, setHighlightRupture } = useStore()

  const option = useMemo(
    () => buildImageryOption(imgData, selectedPeriod),
    [imgData, selectedPeriod]
  )

  const onEvents = {
    click: (params) => {
      if (params.componentType === 'markLine') {
        const year = params.data.xAxis === '中唐' ? 755 : 1127
        setHighlightRupture(year)
        document.getElementById('s6')?.scrollIntoView({ behavior: 'smooth' })
      }
    },
  }

  return (
    <div className="screen">
      <h2 className="screen-title">意象的生死流转</h2>
      <p className="screen-subtitle">
        宏大意象（战、边、山河）与私人意象（帘、梦、月）的时代消长。
        上方折线为外内比（externality = 宏大/私人），1.79→0.57→0.73 揭示"由外向内"与南宋豪放回潮。
      </p>
      <div className="card">
        <ChartBox option={option} style={{ height: 520 }} onEvents={onEvents} />
      </div>
    </div>
  )
}
