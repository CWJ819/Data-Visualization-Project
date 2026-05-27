import { DatePicker } from 'antd'
import useStore from '@/store/useStore'

const { RangePicker } = DatePicker

function DashboardHeader({ onRangeChange }) {
  const rawData = useStore(s => s.rawData)
  const filteredData = useStore(s => s.filteredData)

  const latest = filteredData.length ? filteredData[filteredData.length - 1] : null

  const stats = [
    { label: '数据天数', value: filteredData.length, unit: '天', icon: '📅', color: '#a6fffe' },
    { label: '当前体重', value: latest?.weight ?? '-', unit: 'kg', icon: '⚖️', color: '#a6fffe' },
    { label: '日均摄入', value: latest ? Math.round(filteredData.reduce((s, d) => s + d.calIn, 0) / filteredData.length) : '-', unit: 'kcal', icon: '🍽️', color: '#a6fffe' },
    { label: '平均睡眠', value: latest ? +(filteredData.reduce((s, d) => s + d.sleepHours, 0) / filteredData.length).toFixed(1) : '-', unit: 'h', icon: '😴', color: '#a6fffe' },
  ]

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem',
      padding: '1.5rem 2rem', maxWidth: 1600, margin: '0 auto 2rem',
    }}>
      <div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800,
          background: 'linear-gradient(135deg, #2ecc71 0%, #00b4d8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: 0, letterSpacing: '0.02em',
        }}>
          🏥 HealthVis — 健康数据可视化分析
        </h1>
        <p style={{ color: '#ffffff', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
          热量摄入 · 热量消耗 · 睡眠质量 · 营养结构 → 体重变化关系
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <RangePicker
          onChange={onRangeChange}
          size="large"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(46,204,113,0.12)', borderRadius: 12 }}
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(46,204,113,0.12)', borderRadius: 12,
              padding: '0.7rem 1rem', textAlign: 'center', minWidth: 90,
            }}>
              <div style={{ fontSize: '0.75rem', color: '#ffffff', marginBottom: 2 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}<span style={{ fontSize: '0.7rem', color: '#ffffff' }}> {s.unit}</span></div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
