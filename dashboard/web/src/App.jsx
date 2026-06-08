import './App.css'
import { useStore } from './shared/store'
import { StarDrawer } from './shared/components/StarDrawer'
import { S1Timeline } from './features/s1-timeline'
import { S2Imagery }  from './features/s2-imagery'
import { S3Genre }    from './features/s3-genre'
import { S4Geo }      from './features/s4-geo'
import { S5WordCloud } from './features/s5-wordcloud'
import { S6Rupture }  from './features/s6-rupture'

const SCREENS = [
  { id: 's1', label: '情感时间轴' },
  { id: 's2', label: '意象河流' },
  { id: 's3', label: '体裁演化' },
  { id: 's4', label: '地理分布' },
  { id: 's5', label: '词频对比' },
  { id: 's6', label: '断裂断面' },
]

export default function App() {
  const activeStar = useStore(s => s.activeStar)

  return (
    <>
      {/* 顶部导航 */}
      <nav className="nav">
        <span className="nav-title">唐宋诗词的时代回响</span>
        {SCREENS.map(s => (
          <button
            key={s.id}
            className="nav-btn"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* 六屏内容 */}
      <main style={{ paddingRight: activeStar ? 360 : 0, transition: 'padding 0.3s' }}>
        <section id="s1"><S1Timeline /></section>
        <section id="s2"><S2Imagery /></section>
        <section id="s3"><S3Genre /></section>
        <section id="s4"><S4Geo /></section>
        <section id="s5"><S5WordCloud /></section>
        <section id="s6"><S6Rupture /></section>
      </main>

      {/* 全局诗作详情侧边栏 */}
      <StarDrawer />
    </>
  )
}
