// Percent change of every value from the first.
export function percentChanges(values: number[]): number[] {
  const base = values[0] || 1
  return values.map((value) => (value / base - 1) * 100)
}

// How far the last value sits below the period's high, and the deepest fall from a running
// high at any point, both as negative percentages.
export function drawdowns(values: number[]): { current: number; worst: number } {
  let peak = values[0] ?? 0
  let worst = 0
  for (const value of values) {
    peak = Math.max(peak, value)
    worst = Math.min(worst, peak ? (value / peak - 1) * 100 : 0)
  }
  const last = values.at(-1) ?? 0
  return { current: peak ? (last / peak - 1) * 100 : 0, worst }
}

// Pearson correlation of step-to-step returns, using only steps where both series really
// traded, so a market closed for the weekend doesn't count as a flat move.
export function returnCorrelation(
  a: { values: number[]; present: boolean[] },
  b: { values: number[]; present: boolean[] },
): number | null {
  const ra: number[] = []
  const rb: number[] = []
  let previous: number | null = null
  for (let index = 0; index < a.values.length; index++) {
    if (!a.present[index] || !b.present[index]) continue
    if (previous !== null) {
      ra.push(a.values[index]! / a.values[previous]! - 1)
      rb.push(b.values[index]! / b.values[previous]! - 1)
    }
    previous = index
  }
  if (ra.length < 5) return null
  const mean = (list: number[]) => list.reduce((sum, value) => sum + value, 0) / list.length
  const ma = mean(ra)
  const mb = mean(rb)
  let covariance = 0
  let va = 0
  let vb = 0
  ra.forEach((value, index) => {
    const da = value - ma
    const db = rb[index]! - mb
    covariance += da * db
    va += da * da
    vb += db * db
  })
  return va && vb ? covariance / Math.sqrt(va * vb) : null
}
