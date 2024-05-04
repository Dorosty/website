
import {
  setCursor, getCursor, getSegments, getWindowData, sendMessage
} from '../global'
import d from '../d'
import colors from '../colors'
import animations from '../animations'
import drawFirstSection, { getFirstSectionData } from './firstSection'
import drawFirstSectionScroll from './firstSectionScrollIndicator'
import drawLayersSection from './layersSection'
import drawBrainSection from './brainSection'
import drawFrameworksSection from './frameworksSection'
import drawContact from './contact'
import drawMenu from './menu'
import drawScrollbar from './scrollbar'

const bg = d()


let lastCursor = 'default'
export default dt => {
  setCursor('default')

  const { keyDown } = getWindowData()
  if ([
    'ArrowUp', 'ArrowLeft', 'PageUp', 'Numpad8', 'Numpad4'
    ].includes(keyDown)) {
    const scroll = animations.scroll.value()
    const segments = getSegments()[0].filter(({ name }) => name.endsWith('Rest'))
    const i = segments.findIndex(({ value }) => value > scroll - 100) || 1
    sendMessage({ scroll: segments[i - 1].value })
  } else if ([
    'ArrowDown', 'ArrowRight', 'PageDown', 'Numpad2', 'Numpad6', 'Space'
    ].includes(keyDown)) {
    const scroll = animations.scroll.value()
    const segments = getSegments()[0].filter(({ name }) => name.endsWith('Rest'))
    const segment = segments.find(({ value }) => value > scroll + 100)
      || segments[segments.length - 1]
    sendMessage({ scroll: segment.value })
  }


  bg.drawRect(colors.bg)

  const [isMobile, firstSectionObjects] = getFirstSectionData()
  drawFirstSection(isMobile)
  drawFirstSectionScroll(isMobile, firstSectionObjects.frontend)
  drawLayersSection(dt)
  drawBrainSection(dt)
  drawFrameworksSection(dt)
  drawContact()
  drawMenu(isMobile, firstSectionObjects)
  drawScrollbar()

  const cursor = getCursor()
  if (cursor !== lastCursor) sendMessage({ cursor })
  lastCursor = cursor
}
