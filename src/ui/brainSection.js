
import createMiddleSection from './createMiddleSection'
import d from '../d'
import colors from '../colors'
import animations from '../animations'


const darkmodeCache = { 0: {}, 1: {}, others: {} }
let accOffset = 0
let lastOffset

export default createMiddleSection({
  isLeading: false,
  lerpName: 'brain',
  text: 'I am driven by the challenge of finding solutions to complex problems. There is nothing quite as satisfying as tackling a difficult issue, breaking it down into smaller pieces, and piecing together a solution that not only solves the problem at hand, but also lays the foundation for future progress.',
  drawFig(zd, dt) {
    accOffset += dt / 50
    accOffset %= 65
    const dm = animations.darkMode.value()
    const isEdge = [0, 1].includes(dm)
    let majorCache
    if (isEdge)
      majorCache = darkmodeCache[dm]
    else
      majorCache = darkmodeCache.others[dm]
    if (!majorCache) {
      majorCache = {}
      if (isEdge)
        darkmodeCache[dm] = majorCache
      else
        darkmodeCache.others[dm] = majorCache
    }
    let cache = majorCache[zd]
    if (!cache) {
      cache = Array(65)
      majorCache[zd] = cache
    }
    const offset = Math.round(accOffset)
    let ctx = cache[offset]
    if (!ctx) {
      ctx = new OffscreenCanvas(zd, zd).getContext('2d')
      ctx.lineWidth = 4
      ctx.setLineDash([50, 15])
      ctx.lineDashOffset = offset
      ctx.strokeStyle = colors.fg
      d().x0.y0.xd(zd).yd(zd).qx(2).qy(2).drawPath('brain', 4, { ctx })
      ctx.filter = 'blur(2px)'
      ctx.setLineDash([15, 50])
      ctx.lineDashOffset += 15
      ctx.strokeStyle = colors.highlight
      ctx.stroke()
      cache[offset] = ctx
    }
    const shouldRedraw = offset !== lastOffset
    lastOffset = offset
    return [ctx.canvas, shouldRedraw]
  },
})
