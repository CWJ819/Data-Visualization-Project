import { useStore } from '../store'
import { PERIODS, PERIOD_COLORS } from '../constants/periods'

export function PeriodSelector({ style }) {
  const { selectedPeriod, setSelectedPeriod } = useStore()

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', ...style }}>
      {PERIODS.map(p => {
        const active = selectedPeriod === p
        const color  = PERIOD_COLORS[p]
        return (
          <button
            key={p}
            onClick={() => setSelectedPeriod(active ? null : p)}
            style={{
              padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
              border: `1px solid ${color}`,
              background: active ? color : 'transparent',
              color:  active ? '#0d1117' : color,
              fontWeight: active ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {p}
          </button>
        )
      })}
      {selectedPeriod && (
        <button
          onClick={() => setSelectedPeriod(null)}
          style={{
            padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
            border: '1px solid #555', background: 'transparent', color: '#888',
          }}
        >
          ✕ 清除
        </button>
      )}
    </div>
  )
}
