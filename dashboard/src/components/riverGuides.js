const GUIDE_END_X = 78

export function getRiverGuideValues(seriesData, categories) {
  const phases = seriesData.map(d => Number(d[0])).filter(Number.isFinite)
  const firstPhase = Math.min(...phases)
  const values = new Map(categories.map(name => [name, 0]))

  seriesData.forEach(([phase, value, name]) => {
    if (Number(phase) === firstPhase) {
      values.set(name, Number(value) || 0)
    }
  })

  return categories.map(name => values.get(name) || 0)
}

function getStackCenterPositions(values, startPercent, endPercent) {
  const span = endPercent - startPercent
  const total = values.reduce((sum, value) => sum + Math.max(value, 0), 0)

  if (total <= 0) return null

  let cursor = 0
  return values.map((value) => {
    const safeValue = Math.max(value, 0)
    const center = cursor + safeValue / 2
    cursor += safeValue
    return startPercent + (center / total) * span
  })
}

function getUniformPositions(count, startPercent, endPercent) {
  const span = endPercent - startPercent
  const denominator = Math.max(count - 1, 1)

  return Array.from({ length: count }, (_, i) => (
    startPercent + (i / denominator) * span
  ))
}

function relaxPositions(rawPositions, endPercent, minGapPercent) {
  const positions = [...rawPositions]

  for (let i = 1; i < positions.length; i += 1) {
    positions[i] = Math.max(positions[i], positions[i - 1] + minGapPercent)
  }

  const overflow = positions[positions.length - 1] - endPercent
  if (overflow > 0) {
    positions[positions.length - 1] = endPercent
    for (let i = positions.length - 2; i >= 0; i -= 1) {
      positions[i] = Math.min(positions[i], positions[i + 1] - minGapPercent)
    }
  }

  return positions
}

export function createRiverGuides(categories, colors, {
  startPercent,
  endPercent,
  fontSize,
  labelColor,
  values,
  minGapPercent = 0,
}) {
  const targetPositions = values?.length === categories.length
    ? getStackCenterPositions(values, startPercent, endPercent)
    : null
  const rawPositions = targetPositions || getUniformPositions(categories.length, startPercent, endPercent)
  const labelPositions = minGapPercent > 0
    ? relaxPositions(rawPositions, endPercent, minGapPercent)
    : rawPositions

  return categories.map((name, i) => {
    const color = colors[i % colors.length]
    const labelWidth = Math.max(fontSize * 2.8, name.length * fontSize + 8)

    return {
      name,
      color,
      labelColor,
      fontSize,
      labelWidth,
      labelY: labelPositions[i],
      targetY: rawPositions[i],
      guideEndX: GUIDE_END_X,
    }
  })
}
