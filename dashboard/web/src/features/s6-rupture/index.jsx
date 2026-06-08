import { useMemo } from 'react'
import { useData } from '../../shared/hooks/useData'
import { useStore } from '../../shared/store'
import { ChartBox } from '../../shared/components/ChartBox'
import { POLARITY_COLORS } from '../../shared/constants/periods'
import { buildRuptureBarOption } from './option'

function WordBars({ words, color, maxDelta }) {
  if (!words?.length) return null
  return (
    <div className="word-list">
      {words.slice(0, 10).map(w => (
        <div key={w.word} className="word-item">
          <span style={{ width: 36, color: '#c9d1d9', textAlign: 'right', flexShrink: 0 }}>{w.word}</span>
          <div
            className="word-bar"
            style={{
              width: `${Math.abs(w.delta) / maxDelta * 140}px`,
              background: color,
            }}
          />
          <span style={{ color: '#8b949e', fontSize: 11 }}>{w.delta > 0 ? '+' : ''}{w.delta}</span>
        </div>
      ))}
    </div>
  )
}

function RupturePanel({ data, highlighted }) {
  const { setActiveStar } = useStore()
  const barOption = useMemo(() => buildRuptureBarOption(data), [data])
  if (!data) return null

  const maxRising  = Math.max(...(data.rising_words  || []).map(w => Math.abs(w.delta)), 1)
  const maxFalling = Math.max(...(data.falling_words || []).map(w => Math.abs(w.delta)), 1)

  return (
    <div className={`rupture-panel${highlighted ? ' highlighted' : ''}`}>
      <div className="rupture-year">{data.year}</div>
      <div className="rupture-name">{data.rupture}</div>
      <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 12 }}>
        {data.before_period} → {data.after_period}
        {data.sentiment_delta !== null && (
          <span style={{ marginLeft: 8, color: data.sentiment_delta < 0 ? '#f85149' : '#3fb950' }}>
            情感变化 {data.sentiment_delta > 0 ? '+' : ''}{data.sentiment_delta?.toFixed(3)}
          </span>
        )}
      </p>

      <ChartBox option={barOption} style={{ height: 200 }} />

      <div className="chart-row cols-2" style={{ marginTop: 16 }}>
        <div>
          <div className="card-title" style={{ color: '#3fb950' }}>↑ 上升词</div>
          <WordBars words={data.rising_words}  color="#3fb950" maxDelta={maxRising} />
        </div>
        <div>
          <div className="card-title" style={{ color: '#f85149' }}>↓ 下降词</div>
          <WordBars words={data.falling_words} color="#f85149" maxDelta={maxFalling} />
        </div>
      </div>

      {data.curated_stars?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="card-title">策展名篇</div>
          <div className="star-list">
            {data.curated_stars.map(s => (
              <div
                key={s.id}
                className="star-item"
                onClick={() => setActiveStar(s)}
              >
                <div className="star-key-line">
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: POLARITY_COLORS[s.polarity_llm] ?? '#555',
                    marginRight: 6, verticalAlign: 'middle',
                  }} />
                  {s.key_line}
                </div>
                <div className="star-meta">
                  {s.author}《{s.title}》· {s.period}
                  {s.types_llm?.length > 0 && ` · ${s.types_llm.join('/')} `}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function S6Rupture() {
  const { data: r755  } = useData('rupture_755')
  const { data: r1127 } = useData('rupture_1127')
  const { highlightRupture } = useStore()

  return (
    <div className="screen">
      <h2 className="screen-title">两大断裂断面</h2>
      <p className="screen-subtitle">
        安史之乱（755）与靖康之变（1127）前后的量化对比：情感分、外内比、意象密度变化，
        以及最能代表断裂时代精神的策展名篇。
      </p>
      <div className="rupture-grid">
        <RupturePanel data={r755}  highlighted={highlightRupture === 755}  />
        <RupturePanel data={r1127} highlighted={highlightRupture === 1127} />
      </div>
    </div>
  )
}
