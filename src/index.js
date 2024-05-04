
import './polyfill'
import './prepare'
import checkBrowser from './checkBrowser'
import isWorkerEnabled from '../_isWorkerEnabled'



const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
const contentDiv = document.createElement('div')
contentDiv.id = 'content'
document.body.appendChild(contentDiv)
const heightDiv = document.createElement('div')
contentDiv.appendChild(heightDiv)


let scale
const getScreenDimensions = () => [
  Math.round((contentDiv.clientWidth - 100) * scale),
  Math.round((contentDiv.clientHeight - 100) * scale),
]
const updateScale = () => {
  scale = 1
  const [width, height] = getScreenDimensions()
  const minW = 580 / width
  const maxW = 2000 / width
  const minH = 600 / height
  const defaultScale = 1.5 // 0.7 + 0.3 * window.devicePixelRatio
  scale = Math.max(Math.min(defaultScale, maxW), minW, minH)
}
updateScale()

let isTouch = false
let mouseLocation = null
let mouseDown = null
let mouseUp = null
let keyDown = null
const updateMouseLocation = e => {
  mouseLocation = { x: e.pageX * scale, y: e.pageY * scale }
}

let usedAnchorsCount = 0
const anchorUpdaters = []
const resetLinks = () => {
  anchorUpdaters.slice(usedAnchorsCount).forEach(update => update())
  usedAnchorsCount = 0
}
const setLink = (url, params) => {
  let updateLink
  if (usedAnchorsCount < anchorUpdaters.length) {
    updateLink = anchorUpdaters[usedAnchorsCount]
  } else {
    const a = document.createElement('a')
    a.target = '_blank'
    contentDiv.appendChild(a)
    let prevParams = []
    updateLink = (url, params) => {
      if (!url) {
        a.href = ''
        prevParams = ['']
        return
      }
      const allParams = [...params, scale, url]
      const isSame = allParams.every((param, i) => prevParams[i] === param)
      prevParams = allParams
      if (isSame) return
      a.href = url
      ;['left', 'top', 'width', 'height'].forEach((param, i) => {
        a.style[param] = Math.round(params[i] / scale) + 'px'
      })
    }
    a.addEventListener('wheel', () => a.style.pointerEvents = 'none')
    contentDiv.addEventListener('mousemove', () => a.style.pointerEvents = null)
    anchorUpdaters.push(updateLink)
  }
  usedAnchorsCount++
  updateLink(url, params)
}


let sendMessage
const messageHandler = data => {
  if (data.cursor)
    contentDiv.style.cursor = data.cursor
  else if (data.linkUrl)
    setLink(data.linkUrl, data.params)
  else if (data.resetLinks)
    resetLinks()
  else if (data.height)
    heightDiv.style.height = `calc(100% + ${data.height}px)`
  else if (data.scroll !== undefined)
    contentDiv.scrollTo(0, data.scroll)
}

if (checkBrowser()) {
  if (isWorkerEnabled) {
    const worker = new Worker(URL.createObjectURL(
      new Blob([workerCode], { type: 'text/javascript' })))
    worker.onmessage = ({ data }) => messageHandler(data)
    sendMessage = (message, t) => worker.postMessage(message, t)
    const workerCanvas = canvas.transferControlToOffscreen()
    sendMessage({ canvas: workerCanvas }, [workerCanvas])
  } else {
    window.messageHandler = messageHandler
    sendMessage = message => window.workerMessageHandler(message)
    sendMessage({ canvas })
  }

  document.addEventListener('touchstart', () => { isTouch = true })
  document.addEventListener('mousedown', e => {
    updateMouseLocation(e)
    mouseDown = { ...mouseLocation }
    update('mousedown')
  })
  document.addEventListener('mousemove', e => {
    if (isTouch) return
    updateMouseLocation(e)
    update('mousemove')
  })
  document.addEventListener('mouseup', e => {
    updateMouseLocation(e)
    if (!mouseUp) {
      mouseUp = { ...mouseLocation }
      update('mouseup-init')
    }
    mouseDown = mouseUp = null
    update('mouseup')
    isTouch = false
  })
  document.addEventListener('mouseout', e => {
    if (e.relatedTarget != null || e.toElement != null)
      return
    mouseLocation = null
    update('mouseout')
    isTouch = false
  })
  contentDiv.addEventListener('scroll', () => update('scroll'))
  window.addEventListener('resize', () => {
    updateScale()
    update('resize')
  })
  // document.addEventListener('contextmenu', e => {
  //   if (e.target.tagName.toLowerCase() !== 'a')
  //     e.preventDefault()
  // })
  document.addEventListener('keydown', e => {
    const zoomCodes = ['Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract']
    if ((e.ctrlKey || e.metaKey) && zoomCodes.includes(e.code)) {
      e.preventDefault()
      return
    }
    const moveCodes = [
      'ArrowUp', 'ArrowLeft', 'PageUp', 'ArrowDown', 'ArrowRight', 'PageDown', 'Space'
    ]
    if (moveCodes.includes(e.code))
      e.preventDefault()
    keyDown = e.code
    update('keydown')
  })
  document.addEventListener('keyup', () => {
    keyDown = false
    update('keyup')
  })
  document.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey)
      e.preventDefault()
  }, { passive: false })

  const update = eventName => {
    const [width, height] = getScreenDimensions()
    const scroll = contentDiv.scrollTop
    sendMessage({
      eventName, isTouch, width, height, scroll,
      mouseLocation, mouseDown, mouseUp, keyDown,
    })
  }
  update()
}

