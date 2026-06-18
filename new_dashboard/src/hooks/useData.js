import { useState, useEffect, useMemo } from 'react'

const CACHE = {}

function loadJSON(url) {
  if (CACHE[url]) return Promise.resolve(CACHE[url])
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
      return r.json()
    })
    .then(data => {
      CACHE[url] = data
      return data
    })
}

export function useData(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    loadJSON(url)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) { setError(e); setData(null) } })
    return () => { cancelled = true }
  }, [url])

  return { data, error }
}

export function useImageryFiltered(byPhase, range) {
  return useMemo(() => {
    if (!byPhase || !range) return []
    const [min, max] = range
    const merged = {}
    for (let p = min; p <= max; p++) {
      const entries = byPhase[String(p)]
      if (!entries) continue
      for (const [word, count] of Object.entries(entries)) {
        merged[word] = (merged[word] || 0) + count
      }
    }
    return Object.entries(merged)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, value]) => ({ name, value }))
  }, [byPhase, range])
}
