// ========== Data Transform Utilities ==========

// Compute Pearson correlation matrix for given fields
export function computeCorrelationMatrix(data, fields) {
  const n = fields.length
  const matrix = Array.from({ length: n }, () => Array(n).fill(0))
  const labels = fields

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = pearsonCorrelation(
        data.map(d => d[fields[i]]),
        data.map(d => d[fields[j]])
      )
    }
  }

  return { matrix, labels }
}

// Pearson correlation coefficient
function pearsonCorrelation(x, y) {
  const n = x.length
  if (n < 3) return 0

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0, denX = 0, denY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const den = Math.sqrt(denX * denY)
  return den === 0 ? 0 : +(num / den).toFixed(3)
}

// Simple linear regression: y = slope * x + intercept
export function linearRegression(x, y) {
  const n = x.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY)
    den += (x[i] - meanX) ** 2
  }

  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX

  // R-squared
  let ssRes = 0, ssTot = 0
  for (let i = 0; i < n; i++) {
    ssRes += (y[i] - (slope * x[i] + intercept)) ** 2
    ssTot += (y[i] - meanY) ** 2
  }
  const r2 = ssTot === 0 ? 0 : +(1 - ssRes / ssTot).toFixed(3)

  return { slope: +slope.toFixed(4), intercept: +intercept.toFixed(2), r2 }
}

// Aggregate data by week
export function aggregateByWeek(data, dateField = 'date') {
  const weeks = {}
  data.forEach(d => {
    const date = new Date(d[dateField])
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().split('T')[0]

    if (!weeks[key]) weeks[key] = { count: 0, items: [] }
    weeks[key].count++
    weeks[key].items.push(d)
  })

  return Object.entries(weeks).map(([week, group]) => {
    const avg = {}
    Object.keys(group.items[0]).forEach(k => {
      if (k === dateField) { avg[k] = week; return }
      const vals = group.items.map(item => item[k])
      if (typeof vals[0] === 'number') {
        avg[k] = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      } else {
        avg[k] = vals[0]
      }
    })
    avg.count = group.count
    return avg
  })
}
