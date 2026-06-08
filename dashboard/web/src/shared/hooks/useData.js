import { useState, useEffect } from 'react'

const cache = {}

export function useData(name) {
  const [data, setData] = useState(cache[name] || null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache[name]) { setData(cache[name]); return }
    fetch(`/data/${name}.json`)
      .then((r) => { if (!r.ok) throw new Error(`${name}: ${r.status}`); return r.json() })
      .then((d) => { cache[name] = d; setData(d) })
      .catch((e) => setError(e.message))
  }, [name])

  return { data, error }
}
