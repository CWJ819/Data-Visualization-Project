import { useCallback, useState } from 'react'
import { useData, useImageryFiltered } from './hooks/useData.js'
import TypeRiver from './components/TypeRiver.jsx'
import ThemeRiver from './components/ThemeRiver.jsx'
import TrendLine from './components/TrendLine.jsx'
import RangeSlider from './components/RangeSlider.jsx'
import WordCloud from './components/WordCloud.jsx'
import GeoMap from './components/GeoMap.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  const [range, setRange] = useState([1, 12])
  const [selectedImagery, setSelectedImagery] = useState([])

  const { data: typesData } = useData('/data/types_by_phase.json')
  const { data: themesData } = useData('/data/themes_by_phase.json')
  const { data: imageryData } = useData('/data/imagery_by_phase.json')
  const { data: geoData } = useData('/data/geo_by_phase.json')
  const { data: trendData } = useData('/data/imagery_trend.json')

  const filteredImagery = useImageryFiltered(imageryData, range)

  const toggleImagery = useCallback((name) => {
    setSelectedImagery(prev => {
      if (prev.includes(name)) return prev.filter(item => item !== name)
      if (prev.length < 2) return [...prev, name]
      return [prev[1], name]
    })
  }, [])

  return (
    <div className="app">
      <aside className="title-panel">
        <img className="title-image" src="/assets/title.png" alt="唐宋诗词的时代回响" />
      </aside>

      <aside className="decor-panel">
        <div className="period-control">
          <div className="period-control-title">阶段范围 {range[0]}-{range[1]}</div>
          <RangeSlider value={range} onChange={setRange} min={1} max={12} />
        </div>
      </aside>

      <section className="dashboard-cell river-a">
        <div className="cell-title">河流图 A · 情感类型</div>
        <div className="chart-area">
          <ErrorBoundary>
            <TypeRiver data={typesData} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell river-b">
        <div className="cell-title">河流图 B · 题材分类</div>
        <div className="chart-area">
          <ErrorBoundary>
            <ThemeRiver data={themesData} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell geo-cell">
        <div className="cell-title">地理分布图</div>
        <div className="chart-area">
          <ErrorBoundary>
            <GeoMap data={geoData} range={range} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell trend-cell">
        <div className="cell-title">意象变化折线图</div>
        <div className="chart-area">
          <ErrorBoundary>
            <TrendLine data={trendData} selectedImagery={selectedImagery} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell wordcloud-cell">
        <div className="cell-title">
          意象词云（阶段：{range[0]}-{range[1]}）
          {selectedImagery.length > 0 && (
            <span className="title-selection">已选：{selectedImagery.join(' / ')}</span>
          )}
        </div>
        <div className="chart-area">
          <ErrorBoundary>
            <WordCloud
              data={filteredImagery}
              trendData={trendData}
              onToggleImagery={toggleImagery}
            />
          </ErrorBoundary>
        </div>
      </section>
    </div>
  )
}
