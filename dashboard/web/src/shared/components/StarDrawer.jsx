import { useStore } from '../store'
import { POLARITY_COLORS } from '../constants/periods'

export function StarDrawer() {
  const { activeStar: star, setActiveStar } = useStore()
  if (!star) return null

  const polarityColor = POLARITY_COLORS[star.polarity_llm] ?? POLARITY_COLORS[null]

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
      background: '#1a1a2e', borderLeft: '1px solid #30363d',
      padding: '24px 20px', overflowY: 'auto', zIndex: 1000,
      boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
    }}>
      <button
        onClick={() => setActiveStar(null)}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none',
          color: '#8b949e', fontSize: 20, cursor: 'pointer',
        }}
      >✕</button>

      <div style={{ height: 3, background: polarityColor, borderRadius: 2, marginBottom: 20 }} />

      <div style={{
        fontSize: 15, color: '#e8d5a3', lineHeight: 1.9, marginBottom: 14,
        fontFamily: 'serif', borderLeft: `3px solid ${polarityColor}`, paddingLeft: 12,
      }}>
        {star.key_line}
      </div>

      <div style={{ color: '#8b949e', fontSize: 13, marginBottom: 18 }}>
        {star.author} · {star.period} · {star.dynasty === '唐' ? '诗' : '词'}
      </div>

      {star.polarity_llm && (
        <div style={{ marginBottom: 10 }}>
          <Tag color={polarityColor}>{star.polarity_llm}</Tag>
          {(star.types_llm || []).map(t => <Tag key={t} color="#444">{t}</Tag>)}
        </div>
      )}

      {star.theme_llm && (
        <div style={{ color: '#8b949e', fontSize: 12, marginBottom: 6 }}>
          题材：{star.theme_llm}
        </div>
      )}
      {star.stage_llm && (
        <div style={{ color: '#8b949e', fontSize: 12, marginBottom: 14 }}>
          创作背景：{star.stage_llm}
        </div>
      )}

      {star.curated_tags?.length > 0 && (
        <div>
          {star.curated_tags.map(t => (
            <Tag key={t} color="#8B2635">{t} · 亲历名篇</Tag>
          ))}
        </div>
      )}

      {!star.polarity_llm && (
        <div style={{ color: '#444', fontSize: 12, marginTop: 12 }}>
          此首暂无 LLM 情感标注
        </div>
      )}
    </div>
  )
}

function Tag({ color, children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      marginRight: 6, marginBottom: 4,
      background: color + '33', border: `1px solid ${color}`,
      borderRadius: 4, color, fontSize: 12,
    }}>
      {children}
    </span>
  )
}
