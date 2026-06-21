import { useRef, useCallback } from 'react'

const PHASES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const PHASE_LABELS = [
  '盛唐前期', '盛唐后期', '唐易代转折', '中唐前期',
  '中唐后期', '晚唐时期', '五代十国', '北宋前期',
  '北宋中期', '北宋晚期', '宋易代转折', '南宋中后期',
]

export default function StageSelector({ value, onChange }) {
  const trackRef = useRef(null)

  const pct = (v) => ((v - 1) / 11) * 100

  const posToPhase = useCallback((clientY) => {
    const rect = trackRef.current.getBoundingClientRect()
    const y = (clientY - rect.top) / rect.height
    const phase = Math.round(1 + y * 11)
    return Math.max(1, Math.min(12, phase))
  }, [])

  const handleTrackClick = useCallback((e) => {
    const phase = posToPhase(e.clientY)
    if (phase === value) {
      onChange(null)
    } else {
      onChange(phase)
    }
  }, [value, onChange, posToPhase])

  const handleDragStart = useCallback((startClientY, startVal) => {
    const onMove = (e) => {
      const phase = posToPhase(e.clientY)
      onChange(phase)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [onChange, posToPhase])

  return (
    <div className="vstage">
      <div className="vstage-title">
        {value != null ? PHASE_LABELS[value - 1] : '全部阶段'}
      </div>
      <div className="vstage-body" ref={trackRef} onClick={handleTrackClick}>
        <div className="vstage-track" />
        {PHASES.map(p => (
          <div key={p} className="vstage-row" style={{ top: `${pct(p)}%` }}>
            <div className={`vstage-dot ${p === value ? 'active' : ''}`} />
            <span className={`vstage-label ${p === value ? 'active' : ''}`}>
              {PHASE_LABELS[p - 1]}
            </span>
          </div>
        ))}
        {value != null && (
          <div
            className="vstage-thumb"
            style={{ top: `${pct(value)}%` }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleDragStart(e.clientY, value)
            }}
          />
        )}
      </div>
    </div>
  )
}
