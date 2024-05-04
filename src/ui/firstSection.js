
import createLerper from '../lerp'
import colors from '../colors'
import animations from '../animations'
import d, {
  createGradient,
  drawCustomObject,
  save,
  restore,
  setTransform,
} from '../d'
import { isScrollOutOfBounds } from './firstSectionScrollIndicator'
import { isDraggingToggle } from './menu'



let desktopObjects, mobileObjects
export const getObjects = isMobile => {
  const createObjects = (xm, ya) => {
    const frontend = d().xm(xm).yma(ya).txt(
      50, 'Front-End Engineer', { xal: 'd', yal: 'd' })
    const title = frontend.new().syp.y2.txt(
      100, 'Ali Dorosty', { xal: 'd', yal: 'd' })
    return { title, frontend }
  }
  return isMobile
    ? mobileObjects ||= createObjects('0.25', 50)
    : desktopObjects ||= createObjects('0.5', -100)
}

export const getFirstSectionData = () => {
  let objects = getObjects(false)
  let isMobile = objects.title.y < 80 + 64 || isScrollOutOfBounds(objects.frontend)
  if (isMobile)
    objects = getObjects(true)
  return [isMobile, objects]
}


const lerp = createLerper('titleRest')
const titlesObject = { isPartial: true }

export default isMobile => {
  const op = lerp(1, 1, 1, 1, 1, 0)
  if (!op) return

  const { title, frontend } = getObjects(isMobile)

  const getColor = (d, r) => {
    if (r === 0) return colors.bg
    if (op < 1) return colors.fg.op(op)
    const color = colors.fg.op(0)
    const dy = 200
    return createGradient(d.x1, d.ym - dy, d.x2, d.ym + dy,
      [0, colors.fg], [Math.max(0, r - 0.1), colors.fg], [r, color], [1, color])
  }

  const sc = lerp(1, 1, 1, 1, 2, 100)
  const tr = lerp(0, 0, 0, 0, 0, 25)
  const matrix = new DOMMatrix()
    .translate(+title.xm, +title.ym)
    .scale(sc, sc)
    .translate(-title.xm, -title.ym + tr)

  const x = Math.min(title.x, frontend.x)
  const y = Math.min(title.y, frontend.y)
  const x2 = Math.max(title.x2, frontend.x2)
  const y2 = Math.max(title.y2, frontend.y2)
  const xd = x2 - x
  const yd = y2 - y

  const lerpValue = lerp(1, 2, 3, 4, 5, 6)
  const dm = animations.darkMode.value()
  const shouldRedraw = lerpValue !== titlesObject.lerpValue
    || dm !== titlesObject.dm
    || x !== titlesObject.x || y !== titlesObject.y
    || xd !== titlesObject.xd || yd !== titlesObject.yd
    || isDraggingToggle()
  Object.assign(titlesObject, {
    lerpValue, dm, shouldRedraw, x, y, xd, yd,
    drawPartial(ctx) {
      if (!shouldRedraw) return
      ctx.save()
      ctx.fillStyle = colors.bg
      ctx.fillRect(x, y, xd, yd)
      ctx.setTransform(matrix)
      title.drawText(getColor(title, lerp(0, 1, 1, 1, 1, 1)), { ctx })
      frontend.drawText(getColor(frontend, lerp(0, 0, 1, 1, 1, 1)), { ctx })
      ctx.restore()
    }
  })

  save()
  setTransform(matrix)
  drawCustomObject(titlesObject)
  restore()
}

