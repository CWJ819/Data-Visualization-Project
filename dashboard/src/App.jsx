import { useCallback, useState } from 'react'
import { useData, useImageryFiltered } from './hooks/useData.js'
import TypeRiver from './components/TypeRiver.jsx'
import ThemeRiver from './components/ThemeRiver.jsx'
import TrendLine from './components/TrendLine.jsx'
import StageSelector from './components/StageSelector.jsx'
import WordCloud from './components/WordCloud.jsx'
import GeoMap from './components/GeoMap.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const PHASE_NAMES = [
  '盛唐前期', '盛唐后期', '唐易代转折期', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折期', '南宋中后期',
]

export default function App() {
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [selectedImagery, setSelectedImagery] = useState([])

  const { data: typesData } = useData('/data/types_by_phase.json')
  const { data: themesData } = useData('/data/themes_by_phase.json')
  const { data: imageryData } = useData('/data/imagery_by_phase.json')
  const { data: geoData } = useData('/data/geo_by_phase.json')
  const { data: trendData } = useData('/data/imagery_trend.json')
  const { data: imageryAliases } = useData('/data/imagery_group_aliases.json')

  const filteredImagery = useImageryFiltered(imageryData, selectedPhase)

  const toggleImagery = useCallback((name) => {
    const groupName = imageryAliases?.[name] ?? name
    setSelectedImagery(prev => {
      if (prev.includes(groupName)) return prev.filter(item => item !== groupName)
      if (prev.length < 2) return [...prev, groupName]
      return [prev[1], groupName]
    })
  }, [imageryAliases])

  return (
    <div className="app">
      <aside className="title-panel">
        <img className="title-image" src="/assets/title.png" alt="唐宋诗词的时代回响" />
      </aside>

      <aside className="decor-panel">
        <StageSelector value={selectedPhase} onChange={setSelectedPhase} />
      </aside>

      <section className="dashboard-cell river-a">
        <div className="cell-title">情感类型</div>
        <div className="chart-area">
          <ErrorBoundary>
            <TypeRiver data={typesData} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell river-b">
        <div className="cell-title">题材分类</div>
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
            <GeoMap data={geoData} selectedPhase={selectedPhase} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell trend-cell">
        <div className="cell-title">意象变化</div>
        <div className="chart-area">
          <ErrorBoundary>
            <TrendLine data={trendData} selectedImagery={selectedImagery} />
          </ErrorBoundary>
        </div>
      </section>

      <section className="dashboard-cell wordcloud-cell">
        <div className="cell-title">
          意象词云{selectedPhase ? `（${PHASE_NAMES[selectedPhase - 1]}）` : '（全部阶段）'}
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
