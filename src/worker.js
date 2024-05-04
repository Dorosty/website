
import './prepare'
import isWorkerEnabled from '../_isWorkerEnabled'
import animations, { update as updateAnimations } from './animations'
import { invalidateColorCache } from './colors'
import { draw as drawDs } from './d'
import {
  setSendMessage,
  getCtx,
  setCtx,
  setWindowData,
  getWindowData,
  getSegments,
} from './global'

let sendMessage, drawUI, canvas, frameId
let lastT = performance.now()
const frame = () => {
  const t = performance.now()
  const dt = t - lastT
  lastT = t
  updateAnimations(dt * 1000)
  invalidateColorCache()
  drawUI(dt)
  drawDs()
  sendMessage({ resetLinks: true })
  cancelAnimationFrame(frameId)
  frameId = requestAnimationFrame(frame)
}

let isFirstRun = true
const runFrame = isEvent => {
  if (!canvas) return
  if (!getWindowData()) return
  drawUI ||= require('./ui').default
  if (isEvent || isFirstRun)
    frame()
  isFirstRun = false
}

let isFirstMessage = true
let segments
const messageHandler = data => {
  if (data.canvas) {
    canvas = data.canvas
    setCtx(canvas.getContext('2d', { alpha: false }))
    runFrame()
    return
  }
  const { width, height, scroll, eventName } = data
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  setWindowData(data)

  animations.scroll.move(scroll)

  if (isFirstMessage) {
    segments = getSegments()[0]
    sendMessage({ height: segments[segments.length - 1].value })
  }
  isFirstMessage = false

  if (eventName === 'resize') {
    const oldSegments = segments
    const [newSegments] = getSegments()
    segments = newSegments
    if (oldSegments === newSegments) return
    sendMessage({ height: segments[segments.length - 1].value })
    const scroll = animations.scroll.value()
    if (scroll === 0) return
    const i = oldSegments.findIndex(({ value }) => value >= scroll) || 1
    const os = oldSegments[i - 1].value
    const oe = oldSegments[i].value
    const ns = newSegments[i - 1].value
    const ne = newSegments[i].value
    const newScroll = Math.round(ns + (scroll - os) * (ne - ns) / (oe - os))
    if (newScroll !== scroll) {
      animations.scroll.go(newScroll)
      sendMessage({ scroll: newScroll })
    }
  }
  runFrame(eventName)
}

if (isWorkerEnabled) {
  self.onmessage = ({ data }) => messageHandler(data)
  sendMessage = message => self.postMessage(message)
} else {
  window.workerMessageHandler = messageHandler
  sendMessage = message => window.messageHandler(message)
}

setSendMessage(sendMessage)
