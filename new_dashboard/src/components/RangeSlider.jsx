import { useRef, useCallback } from 'react'

const PHASES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function RangeSlider({ value, onChange, min = 1, max = 12 }) {
  const trackRef = useRef(null)
  const [low, high] = value

  const pct = (v) => ((v - min) / (max - min)) * 100

  const handleTrackClick = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const phase = Math.round(min + x * (max - min))
    const clamped = Math.max(min, Math.min(max, phase))
    const distLow = Math.abs(clamped - low)
    const distHigh = Math.abs(clamped - high)
    if (distLow <= distHigh) {
      onChange([Math.min(clamped, high), Math.max(clamped, high)])
    } else {
      onChange([Math.min(low, clamped), Math.max(low, clamped)])
    }
  }, [min, max, low, high, onChange])

  const handleDragStart = useCallback((startX, startVal, isLow) => {
    const onMove = (e) => {
      const rect = trackRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const phase = Math.round(min + x * (max - min))
      const clamped = Math.max(min, Math.min(max, phase))
      if (isLow) {
        onChange([Math.min(clamped, high), high])
      } else {
        onChange([low, Math.max(clamped, low)])
      }
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [min, max, low, high, onChange])

  return (
    <div className="range-slider" ref={trackRef} onClick={handleTrackClick}>
      <div className="slider-track">
        <div className="slider-fill" style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }} />
      </div>
      <div
        className="slider-thumb slider-thumb-low"
        style={{ left: `${pct(low)}%` }}
        onMouseDown={(e) => {
          e.stopPropagation()
          handleDragStart(e.clientX, low, true)
        }}
      />
      <div
        className="slider-thumb slider-thumb-high"
        style={{ left: `${pct(high)}%` }}
        onMouseDown={(e) => {
          e.stopPropagation()
          handleDragStart(e.clientX, high, false)
        }}
      />
      <div className="slider-labels">
        {PHASES.map(p => (
          <span key={p} className={`slider-label ${p >= low && p <= high ? 'active' : ''}`}
            style={{ left: `${pct(p)}%` }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
