import { useMemo, useEffect, useRef } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { PeriodSelector } from '../../shared/components/PeriodSelector'
import { buildGeoOption } from './option'
import echarts from '../../echarts'

let chinaRegistered = false

export function S4Geo() {
  const { data: geoData }  = useData('place_geo')
  const { selectedPeriod } = useStore()
  const initRef = useRef(false)

  // 只注册一次 china 地图
  useEffect(() => {
    if (chinaRegistered || initRef.current) return
    initRef.current = true
    fetch('/map/china.json')
      .then(r => r.json())
      .then(json => { echarts.registerMap('china', json); chinaRegistered = true })
      .catch(e => console.warn('china.json 加载失败', e))
  }, [])

  const option = useMemo(
    () => buildGeoOption(geoData, selectedPeriod),
    [geoData, selectedPeriod]
  )

  return (
    <div className="screen">
      <h2 className="screen-title">地域空间坍缩</h2>
      <p className="screen-subtitle">
        诗词地名分布热点随时代推移的变化。盛唐塞北边疆密集，宋代收缩至汴京／江南都市圈。
        选择时期查看该时期的地理重心，不选则显示唐宋总体。
      </p>
      <PeriodSelector style={{ marginBottom: 16 }} />
      <div className="card">
        <ChartBox option={option} style={{ height: 520 }} />
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
        ※ 地名基于 `place_coords` 经纬度散点；宋词中北宋首都多以"东京"/"故都"出现，汴京计数为 0 属语料限制。
      </p>
    </div>
  )
}
