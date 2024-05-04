
import { getMaxScroll, getWindowData, setCursor, sendMessage } from '../global'
import { inverse } from '../animations'
import colors from '../colors'
import d from '../d'


const marginH = 8
const rad = 4
const scrollBase = d().xd(2 * rad).x2p(8).yd(100).qyp(marginH)
const anims = {
  hover: inverse(0.1),
  down: inverse(0.1),
}
let down

export default () => {
  const { scroll, isTouch, mouseDown, mouseLocation } = getWindowData()
  const maxY = d().yd - scrollBase.yd
  let scrollD
  if (down) {
    const y = Math.max(0, Math.min(maxY,
      down.y + mouseLocation.y - down.mouseY - marginH))
    scrollD = scrollBase.y(y).qy(marginH)
    sendMessage({ scroll: getMaxScroll() * y / maxY })
  } else {
    scrollD = scrollBase
      .y(maxY * scroll / getMaxScroll())
      .qy(marginH)
  }
  scrollD.drawRect(colors.n1
    .mix(colors.fg, anims.hover.value())
    .mix(colors.highlight, anims.down.value()), rad)
  if (mouseDown && !isTouch) {
    setCursor('pointer')
    down ||= scrollD.in(mouseDown)
      ? { y: scrollD.y, mouseY: mouseDown.y, scroll }
      : null
  } else {
    down = null
  }
  const isIn = scrollD.in()
  if (isIn)
    setCursor('pointer')
  anims.down.move(down ? 1 : 0)
  anims.hover.move(isIn ? 1 : 0)
}
