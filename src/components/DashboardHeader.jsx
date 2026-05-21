import { DatePicker } from 'antd'
import useStore from '@/store/useStore'

const { RangePicker } = DatePicker

function DashboardHeader({ onRangeChange }) {
  const rawData = useStore(s => s.rawData)
  const filteredData = useStore(s => s.filteredData)

  const latest = filteredData.length ? filteredData[filteredData.length - 1] : null

  const stats = [
    { label: '数据天数', value: filteredData.length, unit: '天', icon: '📅', color: '#00d4aa' },
    { label: '当前体重', value: latest?.weight ?? '-', unit: 'kg', icon: '⚖️', color: '#00d4aa' },
    { label: '日均摄入', value: latest ? Math.round(filteredData.reduce((s, d) => s + d.calIn, 0) / filteredData.length) : '-', unit: 'kcal', icon: '🍽️', color: '#ffa500' },
    { label: '平均睡眠', value: latest ? +(filteredData.reduce((s, d) => s + d.sleepHours, 0) / filteredData.length).toFixed(1) : '-', unit: 'h', icon: '😴', color: '#667eea' },
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
          background: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: 0, letterSpacing: '0.02em',
        }}>
          🏥 HealthVis — 健康数据可视化分析
        </h1>
        <p style={{ color: '#8892a4', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
          热量摄入 · 热量消耗 · 睡眠质量 · 营养结构 → 体重变化关系
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <RangePicker
          onChange={onRangeChange}
          size="large"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              padding: '0.7rem 1rem', textAlign: 'center', minWidth: 90,
            }}>
              <div style={{ fontSize: '0.75rem', color: '#8892a4', marginBottom: 2 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}<span style={{ fontSize: '0.7rem', color: '#8892a4' }}> {s.unit}</span></div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
