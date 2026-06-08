import { useMemo } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { buildGenreOption } from './option'

export function S3Genre() {
  const { data: genreData } = useData('genre_by_period')
  const { selectedPeriod } = useStore()

  const option = useMemo(
    () => buildGenreOption(genreData, selectedPeriod),
    [genreData, selectedPeriod]
  )

  return (
    <div className="screen">
      <h2 className="screen-title">诗体的新陈代谢</h2>
      <p className="screen-subtitle">
        各时期体裁占比演变。唐以律诗、绝句为主体，宋词独立成流。
        歌行比例在安史之乱后上升，反映时代动荡中古体写作的复兴。
      </p>
      <div className="card">
        <ChartBox option={option} style={{ height: 400 }} />
      </div>
    </div>
  )
}
