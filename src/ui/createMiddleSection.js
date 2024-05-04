
import createLerper from '../lerp'
import colors from '../colors'
import d, { drawCustomObject, createGradient } from '../d'


export default ({ isLeading, lerpName, text: txt, drawFig }) => {
  const textMobile = d().x('0.05', 16).x2p('0.05', 16).y2p('0.5', 150)
    .txt(20, txt, { xal: 'm', yal: 'd' })
  const textDesktop = textMobile.new()
    .xd('0.4')[isLeading ? 'x' : 'x2p']('0.5', 32).ym('0.5')
  const textLarge = textDesktop.new().xd(600)
  const lerp = createLerper(lerpName + 'Rest')
  const o = { isPartial: true }
  let dd = d()

  return dt => {
    const op = lerp(0, 1, 1, 0)
    if (!op)
      return

    const textY = lerp(200, 0, -20, -200)

    const isMobile = textDesktop.xd < 300
    let textBase = isMobile ? textMobile :
      textDesktop.xd < 600 ? textDesktop : textLarge
    textBase = textBase.txt().yd
    const text = textBase.ya(textY)
    textBase = textBase.ya(200)

    let y1 = +text.y1
    let y2 = +text.y2
    let r = lerp(0, 1, 1, 2)
    if (r === 1) {
      text.drawText(colors.text)
    } else {
      // weird geometry math
      const a = 0.2
      const xm = +text.xm
      const xd = +text.xd
      const yd = +text.yd
      const xda = xd * a
      const xda2 = xda * xda
      const yh = yd / 2
      const w2 = xda2 + yh * yh
      const dx = xd * a + (xd / 2 - xda) * xda2 / w2
      const dy = (xd / 2 - xda) * xda * yh / w2
      const x1 = xm + dx * (isLeading ? -1 : 1)
      const x2 = xm + dx * (isLeading ? 1 : -1)
      y1 -= dy
      y2 += dy
      if (r > 1) {
        r = 2 - r
        const t = y1
        y1 = y2
        y2 = t
      }
      const rp = 1 - Math.pow(r, 3)
      const rgl = op => 1 - rp * (1 - op)
      text.drawText(createGradient(x1, y1, x2, y2,
        [0, colors.text.op(op)],
        [r, colors.text.op(rgl(y1 < y2 ? op : op / 2))],
        [Math.min(1, r + 0.05), colors.text.op(rgl(y1 < y2 ? op / 3 : op / 4))],
        [1, colors.text.op(rgl(0))],
      ))
    }

    if (isMobile) {
      dd = dd.x('0.05', 16).x2p('0.05', 16)
      dd = dd.yd(+dd.xd).y(+textBase.y2, 32)
      if (dd.y2p < 64) {
        dd = dd.y2p(64)
        dd = dd.xm.xd(Math.ceil(dd.yd))
      } else {
        dd = dd.xd(Math.ceil(dd.xd))
      }
      dd = dd.yd(+dd.xd)
    } else {
      dd = dd.xd('0.4')[isLeading ? 'x2p' : 'x']('0.5', 32).ym('0.5')
      dd = dd.xd > 400 ? dd.xd(400) : dd.xd(Math.ceil(dd.xd))
      dd = dd.yd(+dd.xd)
    }
    const ix = Math.round(dd.x)
    const iy = Math.round(dd.y)
    const margin = 10
    const dim = Math.round(dd.xd + 2 * margin)
    let paintFig = drawFig(+dd.xd, dt, lerp, textY)
    let shouldRedraw = true
    if (Array.isArray(paintFig)) {
      shouldRedraw = paintFig[1] || op !== o.op
      paintFig = paintFig[0]
    }
    drawCustomObject(Object.assign(o, {
      x: ix - margin, y: iy - margin, xd: dim, yd: dim,
      paintFig: paintFig || o.paintFig,
      op, shouldRedraw,
      drawPartial(ctx, x, y, xd, yd) {
        if (!shouldRedraw)
          return
        ctx.save()
        ctx.globalAlpha = op
        if (typeof o.paintFig === 'function') {
          ctx.translate(ix, iy)
          o.paintFig(ctx)
        } else {
          ctx.drawImage(o.paintFig, ix, iy)
        }
        ctx.restore()
      },
    }))
  }
}
