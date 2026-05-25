// ========== Sample Data Generator ==========
// Generates 90 days of realistic health tracking data

function randomAround(base, variance) {
  return +(base + (Math.random() - 0.5) * variance).toFixed(1)
}

export function generateSampleData(days = 90) {
  const data = []
  const startDate = new Date(2024, 0, 1) // Jan 1, 2024

  let weight = 80.0    // starting weight (kg)
  let trend = 0         // weight trend accumulator

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    // Calorie intake: 1800-2800, varies daily
    const calIn = randomAround(2200, 400)
    // Calorie expenditure: 2000-2600 (basal + exercise)
    const calOut = randomAround(2300, 250)
    const calDiff = calIn - calOut

    // Nutrition (grams): carbs/protein/fat
    const carbs = randomAround(calIn * 0.45 / 4, 20)  // 45% from carbs
    const protein = randomAround(calIn * 0.25 / 4, 15) // 25% from protein
    const fat = randomAround(calIn * 0.30 / 9, 10)     // 30% from fat

    // Sleep: hours and quality score (1-10)
    const sleepHours = randomAround(7.5, 2)
    const sleepQuality = Math.min(10, Math.max(1, Math.round(randomAround(7, 3))))

    // Weight: cumulative effect of calorie surplus/deficit
    // 7700 kcal ≈ 1kg fat
    trend += calDiff / 7700
    // Add some random daily fluctuation (±0.3kg)
    weight = 80.0 + trend + randomAround(0, 0.3)

    data.push({
      date: dateStr,
      weight: +weight.toFixed(2),
      calIn: Math.round(calIn),
      calOut: Math.round(calOut),
      calDiff: Math.round(calDiff),
      carbs: +carbs.toFixed(1),
      protein: +protein.toFixed(1),
      fat: +fat.toFixed(1),
      sleepHours: +sleepHours.toFixed(1),
      sleepQuality: sleepQuality,
    })
  }
  return data
}
