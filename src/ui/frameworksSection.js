
import createMiddleSection from './createMiddleSection'
import d from '../d'
import colors from '../colors'


const spawnMs = 300
const fadeMs = 3000
const paths = ['html', 'css', 'sass', 'js', 'ts', 'react', 'mobx', 'redux', 'node', 'express', 'jest', 'git']

const iconsCache = {}

const createRandomIcon = time => {
  let iteration = 0
  let i, j
  do {
    i = Math.floor(Math.random() * 6)
    j = Math.floor(Math.random() * 6)
  } while (iteration++ < 20 && icons.some(c => c.i === i && c.j === j))
  let path
  iteration = 0
  do {
    path = paths[Math.floor(Math.random() * paths.length)]
  } while (iteration++ < 20 && icons.some(c => c.path === path))
  return { i, j, path, time }
}


let time = 0
let icons = []
const initCount = 5
Array(initCount).fill().forEach((_, i) => {
  icons.push(createRandomIcon(fadeMs * i / initCount))
})

export default createMiddleSection({
  isLeading: true,
  lerpName: 'frameworks',
  text: 'Frameworks like React are pretty cool! However, I also believe in the importance of staying open-minded and not being tied down to one particular framework or technology. While a library or framework may be the best choice for some projects, there are many ways to develop applications that can be just as effective in different contexts.',
  drawFig: (zd, dt, lerp) => ctx => {
    time += dt
    time %= fadeMs
    icons = icons.filter(icon => (icon.time -= dt) > 0)
    const newIcons = []
    while (time > spawnMs) {
      time -= spawnMs
      newIcons.forEach(icon => { icon.time -= spawnMs })
      const randomIcon = createRandomIcon(fadeMs)
      newIcons.push(randomIcon)
      icons.push(randomIcon)
    }
    const iconWholeDim = zd / 6
    const margin = 7
    const iconDim = iconWholeDim - 2 * margin
    icons.forEach(({ i, j, time, path }) => {
      let cache = iconsCache[zd]
      if (!cache) {
        cache = {}
        iconsCache[zd] = cache
      }
      let { silhouette, stamp } = cache[path] || {}
      if (!silhouette) {
        silhouette = new OffscreenCanvas(iconDim, iconDim).getContext('2d')
        stamp = new OffscreenCanvas(iconDim, iconDim).getContext('2d')
        silhouette.fillStyle = '#000'
        d().x0.y0.xd(iconDim).yd(iconDim).drawPath(path, { ctx: silhouette })
        cache[path] = { silhouette, stamp }
      }
      stamp.globalCompositeOperation = 'source-over'
      stamp.drawImage(silhouette.canvas, 0, 0)
      stamp.globalCompositeOperation = 'source-in'
      stamp.fillStyle = colors.fg.op(1 - Math.abs((time * 2 / fadeMs) - 1))
      stamp.fillRect(0, 0, iconDim, iconDim)
      ctx.drawImage(stamp.canvas,
        iconWholeDim * i + margin,
        iconWholeDim * j + margin)
    })
    ctx.strokeStyle = colors.fg
    Array(5).fill().forEach((_, i) => {
      const xx = iconWholeDim * (i + 1)
      const dx = lerp(-5, 0, 0, 5) * (i - 2) * 1.5
      ctx.beginPath()
      ctx.moveTo(xx + dx, 0)
      ctx.lineTo(xx - dx, zd)
      ctx.stroke() // `drawLine()` doesn't work here
    })
    Array(5).fill().forEach((_, i) => {
      const yy = iconWholeDim * (i + 1)
      ctx.beginPath()
      ctx.moveTo(0, yy)
      ctx.lineTo(zd, yy)
      ctx.stroke() // `drawLine()` doesn't work here
    })
    return ctx.canvas
  },
})
