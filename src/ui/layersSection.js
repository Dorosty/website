
import { spring } from '../animations'
import createMiddleSection from './createMiddleSection'
import colors from '../colors'


let isMovingUp = false
const anims = Array(3).fill().map(() => spring(200, 25))
let lastY
let jiggleGoal = 0
const jiggleAnim = spring(500, 30)


export default createMiddleSection({
  isLeading: true,
  lerpName: 'layers',
  text: 'I have always been fascinated by the inner workings of technology. From the software that powers our devices to the hardware that makes them run, I have a deep-seated curiosity about how different layers work under the hood.',
  drawFig: (zd, dt, lerp, textY) => ctx => {
    if (lastY && lastY !== textY) {
      const newGoal = textY - lastY
      if (Math.abs(newGoal) >= Math.abs(jiggleGoal))
        jiggleGoal = newGoal
      jiggleAnim.move(jiggleGoal)
    }
    lastY = textY
    const jiggle = jiggleAnim.value()
    if (Math.abs(jiggle) >= Math.abs(jiggleGoal)) {
      jiggleGoal = 0
      jiggleAnim.move(0)
    }

    anims.forEach((anim, i) => anim.move(isMovingUp
      ? (i === 0 ? 0      : anims[i - 1].value())
      : (i === 2 ? zd / 2 : anims[i + 1].value())
    ))
    if (!anims[isMovingUp ? 0 : 2].isAnimating())
      isMovingUp = !isMovingUp

    ctx.strokeStyle = colors.fg
    ;[[2, 2], [30, 15], [1, 0]].forEach((lineDash, i) => {
      const x = 0.1 * zd + Math.max(-0.1 * zd, Math.min(0.1 * zd,
        jiggle * (i % 2 ? 1 : -1)))
      const y = Math.max(0, Math.min(0.8 * zd,
        anims[i].value() + zd * (0.1 * i + 0.1)))
      i++
      ctx.lineWidth = i
      ctx.setLineDash(lineDash)
      ctx.beginPath()
      ctx.moveTo(x + zd * 0.1 , y)
      ctx.lineTo(x + zd * 0.8 , y)
      ctx.lineTo(x + zd * 0.7 , y + zd * 0.2)
      ctx.lineTo(x            , y + zd * 0.2)
      ctx.lineTo(x + zd * 0.1 , y)
      ctx.stroke()
      ctx.fillStyle = colors.fg.op(0.02 * i)
      ctx.fill()
    })
  },
})
