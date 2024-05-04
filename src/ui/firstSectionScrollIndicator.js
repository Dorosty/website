
import { inverse, spring } from '../animations'
import createLerper from '../lerp'
import colors from '../colors'
import d from '../d'
import { getToggleDesktop } from './menu'



const anims = {
  move: inverse(0.05),
  bounce: spring(1000, 15),
};

const arrowDim = 10


let desktopObjects, mobileObjects
const getObjects = isMobile => {
  const createObjects = xm => {
    const text = d().xm(xm).yd(20).y2p(64)
      .txt(22, 'scroll down', { spacing: 1.5, xal: 'd' })
    const arrows = [
      text.sx.x1a(10),
      text.sxp.x2a(-10),
    ].map(arrow => arrow.xd(arrowDim).yd(arrowDim).ypa(2))
    return { text, arrows }
  }
  return isMobile
    ? mobileObjects ||= createObjects('0.75')
    : desktopObjects ||= createObjects('0.5')
}

export const isScrollOutOfBounds = frontend => {
  const { text } = getObjects(false)
  const toggle = getToggleDesktop(frontend)
  return text.y - 32 < toggle.y2
}


let isMovingUp = true
const lerp = createLerper('titleGrow')

export default isMobile => {
  const op = lerp(1, 0)
  if (!op) return
  const { text, arrows } = getObjects(isMobile)

  if (isMovingUp && !anims.move.isAnimating()) {
    anims.bounce.go(32).move(0)
    isMovingUp = false
  }
  if (!isMovingUp && !anims.bounce.isAnimating()) {
    anims.move.go(0).move(32)
    isMovingUp = true
  }
  const animV = isMovingUp ? anims.move.value() : anims.bounce.value()

  const color = colors.n1.op(op)
  text.y2pa(animV).drawText(color)
  arrows.forEach(arrow => arrow.ypa(animV).drawPath(color, 'downArrow'))
}
