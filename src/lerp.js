
import { getSegments } from './global'
import animations from './animations'

export default (...segmentNames) => {
  const segmentsCache = new Map()
  return (...values) => {
    const [segmentsArray, segmentsMap] = getSegments()
    let extraCache = segmentsCache.get(segmentsArray)
    if (!extraCache) {
      extraCache = []
      segmentsCache.set(segmentsArray, extraCache)
    }

    let config
    if (typeof values[values.length - 1] === 'object')
      config = values.pop()
    let segments = segmentNames.slice(0, values.length)
      .map(name => segmentsMap[name])
    if (segments.length < values.length) {
      const extra = (values.length - segments.length) / 2
      const cachedSegments = extraCache[extra]
      if (cachedSegments) {
        segments = cachedSegments
      } else {
        const botIndex = segments[0].index
        const topIndex = segments[segments.length - 1].index + 1
        segments = [
          ...segmentsArray.slice(botIndex - Math.ceil(extra), botIndex),
          ...segments,
          ...segmentsArray.slice(topIndex, topIndex + Math.floor(extra)),
        ]
        extraCache[extra] = segments
      }
    }

    if (config) {
      Object.entries(config).forEach(([name, value]) => {
        const segment = segmentsMap[name]
        let i = segments.findIndex(({ index }) => index > segment.index)
        if (i === -1) i = segments.length
        segments = [...segments.splice(0, i), segment, ...segments.splice(i)]
        values.splice(i, 0, value)
      })
    }

    const scroll = animations.scroll.value()
    const i = segments.findIndex(({ value }) => value >= scroll)
    if (i === -1) return values[values.length - 1]
    if (i === 0) return values[0]
    const startSegment = segments[i - 1]
    const endSegment = segments[i]
    const from = startSegment.value
    const to = endSegment.value
    const a = values[i - 1]
    const b = values[i]
    const r = (scroll - from) / (to - from)
    return a + (b - a) * r
  }
}
