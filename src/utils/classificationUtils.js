import { quantileSorted, ckmeans } from 'simple-statistics'

export function getBreaks(values, method, numClasses) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 0) return []

  switch (method) {
    case 'quantile':
      return quantileBreaks(sorted, numClasses)
    case 'equalInterval':
      return equalIntervalBreaks(sorted, numClasses)
    case 'jenks':
      return jenksBreaks(sorted, numClasses)
    default:
      return quantileBreaks(sorted, numClasses)
  }
}

function quantileBreaks(sorted, numClasses) {
  const breaks = [sorted[0]]
  for (let i = 1; i < numClasses; i++) {
    breaks.push(quantileSorted(sorted, i / numClasses))
  }
  breaks.push(sorted[sorted.length - 1])
  return breaks
}

function equalIntervalBreaks(sorted, numClasses) {
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const step = (max - min) / numClasses
  const breaks = [min]
  for (let i = 1; i < numClasses; i++) {
    breaks.push(min + step * i)
  }
  breaks.push(max)
  return breaks
}

function jenksBreaks(sorted, numClasses) {
  if (sorted.length <= numClasses) {
    return equalIntervalBreaks(sorted, numClasses)
  }
  const clusters = ckmeans(sorted, numClasses)
  const breaks = [clusters[0][0]]
  for (let i = 0; i < clusters.length - 1; i++) {
    const boundary = clusters[i][clusters[i].length - 1]
    breaks.push(boundary)
  }
  breaks.push(clusters[clusters.length - 1][clusters[clusters.length - 1].length - 1])
  return breaks
}

export function classifyValue(value, breaks) {
  for (let i = 1; i < breaks.length; i++) {
    if (value <= breaks[i]) return i - 1
  }
  return breaks.length - 2
}
