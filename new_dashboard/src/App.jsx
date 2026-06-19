import { useState } from 'react'
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

  const { data: typesData } = useData('/data/types_by_phase.json')
  const { data: themesData } = useData('/data/themes_by_phase.json')
  const { data: imageryData } = useData('/data/imagery_by_phase.json')
  const { data: geoData } = useData('/data/geo_by_phase.json')
  const { data: trendData } = useData('/data/imagery_trend.json')

  const filteredImagery = useImageryFiltered(imageryData, range)

  return (
    <div className="app">
      <header className="app-header">
        <h1>唐宋诗词 · 文学史阶段分析</h1>
        <span className="app-subtitle">基于 LLM 标注的 609 首名篇</span>
      </header>

      <div className="app-body">
        <div className="panel panel-left">
          <ErrorBoundary>
            <div className="river-section">
              <div className="river-title">8 种情感类型 · 河流图</div>
              <div className="river-chart">
                <TypeRiver data={typesData} />
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="river-section">
              <div className="river-title">12 种题材分类 · 河流图</div>
              <div className="river-chart">
                <ThemeRiver data={themesData} />
              </div>
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="river-section">
              <div className="river-title">16 组意象趋势 · 折线图</div>
              <div className="river-chart">
                <TrendLine data={trendData} />
              </div>
            </div>
          </ErrorBoundary>

          <div className="slider-section">
            <RangeSlider value={range} onChange={setRange} min={1} max={12} />
          </div>
        </div>

        <div className="panel panel-right">
          <div className="geo-section">
            <div className="section-title">地理空间分布</div>
            <div className="geo-chart">
              <ErrorBoundary>
                <GeoMap data={geoData} range={range} />
              </ErrorBoundary>
            </div>
          </div>

          <div className="wordcloud-section">
            <div className="section-title">意象词云（阶段 {range[0]}–{range[1]}）</div>
            <div className="wordcloud-chart">
              <ErrorBoundary>
                <WordCloud data={filteredImagery} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
