
export const fontFactors = Object.fromEntries([
  ['helvetica', 0.35, 1.5],
].map(([name, spaceFactor, heightFactor]) => [name, [spaceFactor, heightFactor]]))

const segmentHeights = Object.entries({
  startRest: 0,

  subtitle: 200,
  title: 300,
  titleRest: [200, 3000],
  titleGrow: 500,
  titleLeave: 200,

  layers: 200,
  layersRest: 400,
  layersLeave: 200,

  brain: 200,
  brainRest: 400,
  brainLeave: 200,

  frameworks: 200,
  frameworksRest: 400,
  frameworksLeave: 200,

  contact: 100,
  contactRest: 150,
})
// export const breakpoints = [320, 480, 768, 960, 1024, 1366]
export const breakpoints = [480]
const segmentsCache = []
export const getSegments = () => {
  const breakpoint = 1 + breakpoints.findIndex(width => width > windowData.width)
  const cached = segmentsCache[breakpoint]
  if (cached) return cached
  let accHeight = 0
  const segments = segmentHeights.map(([name, height], index) => {
    if (Array.isArray(height))
      height = height[breakpoint]
    accHeight += height
    return { index, name, value: accHeight }
  })
  const segmentsMap = Object.fromEntries(segments.map(segment =>
    [segment.name, segment]
  ))
  const result = [segments, segmentsMap]
  segmentsCache[breakpoint] = result
  return result
}
export const getMaxScroll = () => {
  const [segments] = getSegments()
  return segments[segments.length - 1].value
}


let sendMessageFn = null
export const sendMessage = message => sendMessageFn(message)
export const setSendMessage = fn => sendMessageFn = fn
let ctx
export const getCtx = () => ctx
export const setCtx = v => { ctx = v }
let windowData
export const getWindowData = () => windowData
export const setWindowData = v => { windowData = v }
let cursor
export const getCursor = () => cursor
export const setCursor = v => { cursor = v }

