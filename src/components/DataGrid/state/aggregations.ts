export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max'

// Pure function over a pre-extracted number array.
// For 'count', values.length is returned directly — caller passes all rows as ones.
// For all other types, null is returned when values is empty.
export function aggregate(values: number[], type: AggregationType): number | null {
  if (type === 'count') return values.length
  if (values.length === 0) return null
  switch (type) {
    case 'sum': return values.reduce((a, b) => a + b, 0)
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length
    case 'min': return Math.min(...values)
    case 'max': return Math.max(...values)
  }
}
