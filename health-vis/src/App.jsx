import { useEffect, useRef } from 'react'
import useStore from '@/store/useStore'
import { generateSampleData } from '@/utils/sampleData'
import { computeCorrelationMatrix } from '@/utils/dataTransform'
import DashboardHeader from '@/components/DashboardHeader'
import WeightTrendPanel from '@/components/WeightTrendPanel'
import NutritionPanel from '@/components/NutritionPanel'
import CorrelationPanel from '@/components/CorrelationPanel'
import HeatmapPanel from '@/components/HeatmapPanel'
import ProfilePanel from '@/components/ProfilePanel'
import SleepPanel from '@/components/SleepPanel'
import './App.less'

function App() {
  const setRawData = useStore(s => s.setRawData)
  const setTimeRange = useStore(s => s.setTimeRange)
  const setCorrelations = useStore(s => s.setCorrelations)
  const rawData = useStore(s => s.rawData)
  const gridRef = useRef(null)

  useEffect(() => {
    const data = generateSampleData(90)
    setRawData(data)
    setTimeRange([data[0].date, data[data.length - 1].date])
    const fields = ['weight', 'calIn', 'calOut', 'calDiff', 'carbs', 'protein', 'fat', 'sleepHours', 'sleepQuality']
    const result = computeCorrelationMatrix(data, fields)
    setCorrelations(result)
  }, [])

  useEffect(() => {
    if (!gridRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), idx * 150)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    gridRef.current.querySelectorAll('.panel.animate-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [rawData?.length])

  const handleRangeChange = (dates) => {
    if (dates?.[0] && dates?.[1]) {
      setTimeRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
    }
  }

  return (
    <div className="dashboard" style={{ minHeight: '100vh' }}>
      <DashboardHeader onRangeChange={handleRangeChange} />
      <div className="dashboard-grid" ref={gridRef} style={{ marginTop: 16 }}>
        <div className="panel animate-in"><WeightTrendPanel /></div>
        <div className="panel animate-in"><CorrelationPanel /></div>
        <div className="panel animate-in"><NutritionPanel /></div>
        <div className="panel animate-in"><ProfilePanel /></div>
        <div className="panel animate-in"><SleepPanel /></div>
        <div className="panel animate-in"><HeatmapPanel /></div>
      </div>
    </div>
  )
}

export default App
