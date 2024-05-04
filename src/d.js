
// TODO: refactor, include readability & break into multiple files
// Potentially convert into its own library

import { fontFactors, getCtx, getWindowData, sendMessage } from './global'
import * as paths from './paths'

const canvasGrowth = 1.5
const drawObject = (ctx, o, [x, y, xd, yd, x2, y2], slice) => {
  let color = o.color
  if (!slice) {
    if (color.isGradient)
      color = color.g(x, y)
    ctx.fillStyle = ctx.strokeStyle = color
    ctx.save()
    ctx.translate(o.x, o.y)
    o.sketch(ctx)
    ctx.restore()
    return
  }
  if (o.isPartial) {
    ctx.fillStyle = ctx.strokeStyle = color
    o.drawPartial(ctx, ...slice, [x, y, xd, yd, x2, y2], o.config)
    return
  }
  let isNewSilhouette = false
  let silhouette = o.silhouette
  const cxd = Math.ceil(xd)
  const cyd = Math.ceil(yd)
  if (!silhouette) {
    isNewSilhouette = true
    silhouette = new OffscreenCanvas(cxd, cyd).getContext('2d')
  } else if (silhouette.canvas.width < cxd || o.silhouette.canvas.height < cyd) {
    isNewSilhouette = true
    silhouette = new OffscreenCanvas(
      Math.ceil(xd * canvasGrowth), Math.ceil(yd * canvasGrowth)
    ).getContext('2d')
  }
  const { width, height } = silhouette.canvas
  if (isNewSilhouette) {
    o.shouldResketch = true
    o.silhouette = silhouette
  }
  if (o.shouldResketch) {
    silhouette.globalCompositeOperation = 'source-over'
    silhouette.strokeStyle = silhouette.fillStyle = '#000'
    o.shouldRedraw = true
    silhouette.clearRect(0, 0, width, height)
    silhouette.setTransform(width / o.xd, 0, 0, height / o.yd, 0, 0)
    o.sketch(silhouette)
  }
  if (o.shouldRedraw || !o.paintSrc) {
    if (color.isGradient)
      color = color.g(x, y, width / xd, height / yd)
    if (color.isTransparent) {
      let stamp = o.stamp
      if (stamp?.canvas.width !== width || stamp.canvas.height !== height)
        o.stamp = stamp = new OffscreenCanvas(width, height).getContext('2d')
      else
        stamp.globalCompositeOperation = 'copy'
      stamp.drawImage(silhouette.canvas, 0, 0)
      stamp.globalCompositeOperation = 'source-in'
      stamp.fillStyle = color
      stamp.fillRect(0, 0, width, height)
      o.paintSrc = stamp
    } else {
      silhouette.globalCompositeOperation = 'source-in'
      silhouette.fillStyle = color
      silhouette.fillRect(0, 0, o.xd, o.yd)
      o.paintSrc = silhouette
    }
  }

  const scx = width / xd
  const scy = height / yd
  const [sx, sy, sxd, syd] = slice

  ctx.drawImage(o.paintSrc.canvas,
    (sx - x) * scx,
    (sy - y) * scy,
    sxd * scx,
    syd * scy,
    sx, sy, sxd, syd,
  )
}

const applyP = (v, p) => p ? sub([0, 1], v) : v
const addAs = (as, k, p, r) => {
  const result = as.reduce((sum, a) => {
    if (a.v)
      return add(sum, a.v)
    if (isNaN(a))
      return add(sum, (r == null ? a[k] : a[k](r)).v)
    a = typeof a === 'string' ? [0, +a] : [a, 0]
    return add(sum, a)
  }, [0, 0])
  return applyP(result, p)
}
const createD = (parent, n, d = {}) => {
  n = { ...parent, ...n, parent: n.o === null ? null : parent }

  ;['x', 'y'].forEach(z => {
    const zCacheKey = `${z}Cache`
    const cache = n[zCacheKey]
    const createDWithZ = (zzs, d) => createD(n, {
      [z]: zzs,
      [zCacheKey]: Object.fromEntries(zzs.map(({ r, v }) => ({ [r]: v }))),
    }, d)
    ;[true, false].forEach(p => {
      const pstr = p ? 'p' : ''
      const getNumFromV = v => {
        const windowData = getWindowData()
        const dim = z === 'x' ? windowData.width : windowData.height
        return toNum(v, dim)
      }
      const getVFromR = r => {
        const cacheValue = cache[r]
        const checkForDAndApplyP = v => r === 'd' ? v : applyP(v, p)
        if (cacheValue) return checkForDAndApplyP(cacheValue)
        const [za, zb] = n[z]
        let dd, vv, rr
        if (za.r === 'd' || zb.r === 'd') {
          const zd = za.r === 'd' ? za : zb
          const zv = za.r === 'd' ? zb : za
          dd = zd.v
          vv = zv.v
          rr = zv.r
        } else {
          dd = mul(1 / (za.r - zb.r), sub(za.v, zb.v))
          vv = za.v
          rr = za.r
        }
        const v = r === 'd' ? dd : add(mul(r, dd), sub(vv, mul(rr, dd)))
        cache[r] = v
        return checkForDAndApplyP(v)
      }
      const placeZZ = (r, v, p = false) => {
        v = applyP(v, p)
        const zz = { r, v }
        const zzs = n[z].map(zz => ({ ...zz }))
        return zzs[1].r === r ? [zzs[0], zz] : [zzs[1], zz]
      }
      const zrp = `${z}r${pstr}`
      d[zrp] = (r, ...as) => {
        if (as.length) {
          const v = addAs(as, zrp, p, r)
          return createDWithZ(placeZZ(r, v))
        }
        const v = getVFromR(r)
        return createDWithZ(placeZZ(r, v, p), { v, valueOf: () => getNumFromV(v) })
      }
      d[`${zrp}a`] = (r, ...as) => d[zrp](r, d[zrp](r), ...as)
      ;[1, 2, 'm', 'd'].forEach(t => {
        if (t === 'd' && p) return
        const r = t === 'd' ? 'd' : t === 'm' ? 0.5 : t - 1
        const ztp = `${z}${t}${pstr}`
        Object.defineProperty(d, ztp, { get: () => {
          const f = (...as) => d[zrp](r, ...as)
          const v = getVFromR(r)
          f.v = v
          f.valueOf = () => getNumFromV(v)
          return createDWithZ(placeZZ(r, v, p), f)
        }})
        d[`${ztp}a`] = (...as) => d[`${zrp}a`](r, ...as)
        Object.defineProperty(d, `${ztp}0`, { get: () => d[ztp](0) })
      })
      const zp = `${z}${pstr}`
      const pSign = p ? -1 : 1
      d[`q${zp}`] = (...as) => {
        const v = addAs(as, `${z}d`, false)
        return createDWithZ(n[z].map(zz => ({ ...zz, v: add(zz.v, zz.r === 'd'
          ? mul(-pSign * 2, v)
          : mul(-pSign * (zz.r * 2 - 1), v))
        })))
      }
      Object.defineProperty(d, `s${zp}`, { get() {
        const l = getVFromR('d')
        return createDWithZ(n[z].map(zz => ({ ...zz, v: add(zz.v, zz.r === 'd'
          ? [0, 0]
          : mul(pSign, l))
        })))
      }})
    })
    ;['', 'p', 'a', 'pa', '0', 'p0'].forEach(px => {
      Object.defineProperty(d, `${z}${px}`, { get: () => d[`${z}1${px}`] })
    })
  })

  const drawFn = (...argNames) => {
    const {
      allowNegativeLength, isPartial, drawPartial, alwaysPrepare, prepare, sketch
    } = argNames.pop()
    return (...args) => {
      let uxd = +d.xd
      let uyd = +d.yd
      const pol = !allowNegativeLength
      if (pol && (uxd < 0 || uyd < 0))
        return
      const ux = +d.x
      const uy = +d.y

      let color = args[0]
      if (color) {
        if (color.isColor || color.isGradient)
          args.shift()
      }

      let params = args[args.length - 1]
      if (typeof params === 'object')
        args.pop()
      else
        params = {}
      args.forEach((arg, i) => { params[argNames[i]] = arg })
      let { ctx, ...config } = params

      let o = n.o
      if (!o) {
        o = {
          pol,
          config,
          isPartial: isPartial === true || isPartial?.(config),
        }
        if (ctx) {
          alwaysPrepare?.(config)
          if (prepare) {
            const [ex, ey, exd, eyd, preparation] = prepare(uxd, uyd, config)
            Object.assign(o, {
              color, x: ux + ex, y: uy + ey, xd: exd, yd: eyd,
              sketch: ctx => sketch(ctx, config, preparation),
            })
          } else {
            Object.assign(o, {
              color, x: ux, y: uy, xd: uxd, yd: uyd,
              sketch: ctx => sketch(ctx, uxd, uyd, config),
            })
          }
          drawObject(ctx, o, [o.x, o.y, o.xd, o.yd, o.x + o.xd, o.y + o.yd])
          return
        }
        let nn = n
        while (nn && !nn.o) {
          nn.o = o
          nn = nn.parent
        }
      }
      drawList.push(o)

      const sizeChanged = uxd !== o.uxd || uyd !== o.uyd
      Object.assign(o, {
        uxd, uyd, color,
        shouldResketch: sizeChanged,
        shouldRedraw: (color !== o.color && (!o.color || (
          color.isGradient !== o.color.isGradient || (
            (
              color.isGradient
              || String(color) !== String(o.color)
            ) && (
              !color.isGradient
              || ['x1', 'y1', 'x2', 'y2'].some(d => color[d] !== o.color[d])
              || color.points.length !== o.color.points.length
              || color.points.some(([r1, c1], i) => {
                const [r2, c2] = o.color.points[i]
                return r1 !== r2 || String(c1) !== String(c2)
              })
            )
          )
        )))
      })

      if (o.isPartial) {
        Object.assign(o, { drawPartial, x: ux, y: uy, xd: uxd, yd: uyd })
        return
      }

      alwaysPrepare?.(config)
      if (prepare) {
        if (sizeChanged) {
          const [ex, ey, exd, eyd, preparation] = prepare(uxd, uyd, config)
          Object.assign(o, {
            ex, ey, x: ux + ex, y: uy + ey, xd: exd, yd: eyd,
            sketch: ctx => sketch(ctx, config, preparation),
          })
        }
        o.x = ux + o.ex
        o.y = uy + o.ey
      } else {
        Object.assign(o, {
          x: ux, y: uy, xd: uxd, yd: uyd,
          sketch: ctx => sketch(ctx, uxd, uyd, config),
        })
      }
    }
  }

  d.drawRect = drawFn('rad', 'stroke', {
    isPartial: ({ stroke, rad }) => !stroke && !rad,
    drawPartial: (ctx, x, y, xd, yd, x2, y2) => {
      x = Math.floor(x)
      y = Math.floor(y)
      x2 = Math.ceil(x2)
      y2 = Math.ceil(y2)
      ctx.fillRect(x, y, x2 - x, y2 - y)
    },
    sketch(ctx, xd, yd, { stroke, rad: r = 0 }) {
      ctx.beginPath()
      const arcTo = (x0, y0, x1, y1) => r && ctx.arcTo(x0, y0, x1, y1, r)
      ctx.moveTo(r, 0)
      ctx.lineTo(xd - r, 0)
      arcTo(xd, 0, xd, 0 + r)
      ctx.lineTo(xd, yd - r)
      arcTo(xd, yd, xd - r, yd)
      ctx.lineTo(r, yd)
      arcTo(0, yd, 0, yd - r)
      ctx.lineTo(0, r)
      arcTo(0, 0, r, 0)
      if (stroke) {
        ctx.lineWidth = stroke
        ctx.stroke()
      } else {
        ctx.fill()
      }
    },
  })

  d.drawLine = drawFn('stroke', {
    allowNegativeLength: true,
    isPartial: true,
    drawPartial(ctx,
      sx1, sy1, sxd, syd, sx2, sy2,
      [x1, y1, xd, yd, x2, y2],
      { stroke = 1 }
    ) {
      const draw = (x1, y1, x2, y2) => {
        if (Math.abs(x1 - x2) <= 1) {
          x1 = x2 = (x1 + x2) / 2
        } else if (x1 < x2) {
          x1 += 0.5
          x2 -= 0.5
        } else {
          x1 -= 0.5
          x2 += 0.5
        }
        if (Math.abs(y1 - y2) <= 1) {
          y1 = y2 = (y1 + y2) / 2
        } else if (y1 < y2) {
          y1 += 0.5
          y2 -= 0.5
        } else {
          y1 -= 0.5
          y2 += 0.5
        }
        ctx.lineWidth = stroke
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      if (xd === 0) {
        if (sx1 <= x1 && x1 <= sx2) { // x1 === x2
          const ys = [y1, y2, sy1, sy2].sort((a, b) => a - b)
          draw(x1, ys[1], x1, ys[2])
        }
        return
      }
      if (yd === 0) {
        if (sy1 <= y1 && y1 <= sy2) { // y1 === y2
          const xs = [x1, x2, sx1, sx2].sort((a, b) => a - b)
          draw(xs[1], y1, xs[2], y1)
        }
        return
      }

      // https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm
      const getCode = (x, y) => {
        let c = 0
        if (x < sx1)
          c |= 1
        else if (x > sx2)
          c |= 2
        if (y < sy1)
          c |= 4
        else if (y > sy2)
          c |= 8
        return c
      }
      let o1 = getCode(x1, y1)
      let o2 = getCode(x2, y2)
      let accept = false
      while (true) {
        if (!(o1 | o2)) {
          accept = true
          break
        } else if (o1 & o2) {
          break
        } else {
          const o = Math.max(o1, o2)
          let x, y
          if (o & 1) {
            x = sx1
            y = y1 + (x - x1) * yd / xd
          } else if (o & 2) {
            x = sx2
            y = y1 + (x - x1) * yd / xd
          } else if (o & 4) {
            y = sy1
            x = x1 + (y - y1) * xd / yd
          } else {
            y = sy2
            x = x1 + (y - y1) * xd / yd
          }
          if (o === o1) {
            x1 = x
            y1 = y
            o1 = getCode(x1, y1)
          } else {
            x2 = x
            y2 = y
            o2 = getCode(x2, y2)
          }        
        }
      }
      if (accept)
        draw(x1, y1, x2, y2)
    },
  })

  d.drawPath = drawFn('pathName', 'stroke', {
    prepare(xd, yd, { pathName }) {
      const dd = xd // === yd
      const path = paths[pathName]
      const { maxX, maxY } = path
      let x = 0
      let y = 0
      if (maxX < maxY) {
        xd *= maxX / maxY
        x = (dd - xd) / 2
      }
      if (maxY < maxX) {
        yd *= maxY / maxX
        y = (dd - yd) / 2
      }
      const commands = path.map(([command, ...args]) =>
        [command, ...args.map(a => a * dd / 512)])
      return [x, y, xd, yd, commands]
    },
    sketch(ctx, { stroke }, commands) {
      ctx.beginPath()
      commands.forEach(([command, ...args]) => {
        ctx[
          command === 'M' ? 'moveTo' :
          command === 'L' ? 'lineTo' :
          'bezierCurveTo'
        ](...args)
      })
      if (stroke) {
        ctx.lineWidth = stroke
        ctx.stroke()
      } else {
        ctx.fill()
      }
    },
  })

  const processText = ({
    xal, yal, size, text, font, spacing, lSpacing, width
  }) => {
    const ctx = getCtx()
    ctx.font = `${size}px "${font}"`
    const [spaceFactor, heightFactor] = fontFactors[font]
    const spaceWidth = size * spaceFactor * spacing
    const lines = []
    let maxLineWidth = 0
    text.split('\n').forEach(lineStr => {
      let lineWidth = 0
      let words = []
      lineStr.split(' ').forEach(word => {
        word = { word, width: ctx.measureText(word).width }
        let newLineWidth = lineWidth + word.width
        if (words.length) newLineWidth += spaceWidth
        if (width && newLineWidth > width) {
          lines.push({ words, width: lineWidth })
          words = [word]
          lineWidth = word.width
          maxLineWidth = Math.max(maxLineWidth, width)
          return
        }
        words.push(word)
        lineWidth = newLineWidth
        maxLineWidth = Math.max(maxLineWidth, lineWidth)
      })
      lines.push({ words, width: lineWidth })
    })
    width ||= maxLineWidth
    const lineHeight = size * heightFactor * lSpacing
    let y = 0
    const words = []
    lines.forEach(({ words: lineWords, width: lineWidth }) => {
      let x = 0
      if (xal === 'c')
        x += (width - lineWidth) / 2
      else if (xal === 'e')
        x += width - lineWidth
      lineWords.forEach(({ word, width: wordWidth }, lineIndex) => {
        words.push({ index: words.length,
          lineIndex, word, x, y, width: wordWidth, height: lineHeight })
        x += spaceWidth + wordWidth
      })
      y += lineHeight
    })
    return { words, width, height: lines.length * lineHeight }
  }

  d.txt = (size, text, {
    xal, yal,
    font = 'helvetica',
    spacing = 1,
    lSpacing = 1,
  } = {}) => {
    let textData, result
    if (size) {
      const textParams = { size, text, xal, yal, font, spacing, lSpacing }
      if (xal?.startsWith('m')) {
        const xd = +d.xd
        if (xd)
          textData = processText({ ...textParams, xal: xal.slice(1), width: xd })
      } else {
        textData = processText(textParams)
      }
      result = createD(n, { textParams, textData })
    } else {
      ({ xal, yal } = textParams)
      if (n.textParams.xal?.startsWith('m')) {
        const xd = +d.xd
        if (xd && n.textParams.width !== xd) {
          n.textParams.width = xd
          textData = n.textData = processText({ ...n.textParams, xal: xal.slice(1) })
        }
      }
      result = d
    }
    if (textData) {
      if (xal === 'd')
        result = result.xd(textData.width)
      if (yal === 'd')
        result = result.yd(textData.height)
    }
    return result
  }

  let { textParams, textData } = n
  const { font, size, xal, yal } = textParams || {}
  d.drawText = drawFn({
    alwaysPrepare({ onWord }) {
      if (!onWord) return
      textData.words.forEach(word => { word.skip = (onWord(word) === false) })
    },
    prepare(xd, yd) {
      textData ||= processText({ ...textParams, width: xd })
      const exd = textData.width
      const eyd = textData.height
      const ex = xal === 'c' ? (xd - exd) / 2 :
                 xal === 'e' ? (xd - exd)     : 0
      const ey = yal === 'c' ? (yd - eyd) / 2 :
                 yal === 'e' ? (yd - eyd)     : 0
      return [ex, ey, exd, eyd]
    },
    sketch(ctx) {
      ctx.textBaseline = 'top'
      ctx.font = `${size}px "${font}"`
      textData.words.filter(word => !word.skip)
        .forEach(({ word, x, y, width, height }, i) => ctx.fillText(word, x, y))
    },
  })

  d.in = (mouse = getWindowData().mouseLocation) => {
    if (!mouse) return false
    const { x1, x2, y1, y2 } = d
    return x1 <= mouse.x && mouse.x <= x2 && y1 <= mouse.y && mouse.y <= y2
  }

  d.link = url => sendMessage({ linkUrl: url, params: [+d.x, +d.y, +d.xd, +d.yd] })

  d.new = () => createD(n, { o: null })

  return d
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
export const mul = (s, a) => [s * a[0], s * a[1]]
export const toNum = (a, dim) => a[0] + dim * a[1]

export const createGradient = (x1, y1, x2, y2, ...points) => {
  x1 = +x1
  y1 = +y1
  x2 = +x2
  y2 = +y2
  const result = { isGradient: true, x1, y1, x2, y2, points }
  let isTransparent
  const gs = {}
  result.g = (x, y, xr = 1, yr = 1) => {
    const gKey = [x, y, xr, yr].join('|')
    let g = gs[gKey]
    if (g) return g
    g = getCtx().createLinearGradient(
      xr * (x1 - x), yr * (y1 - y), xr * (x2 - x), yr * (y2 - y))
    points.forEach(([r, color]) => g.addColorStop(r, color))
    Object.defineProperty(g, 'isTransparent', { get() {
      isTransparent ||= points.some(([_, color]) => color.isTransparent)
      return isTransparent
    }})
    gs[gKey] = g
    return g
  }
  return result
}

let currentMatrix = new DOMMatrix()
let matrices = []
let drawList = []
const transform = fn => (...args) => {
  currentMatrix = fn(...args)
  drawList.push(currentMatrix)
}
export const save = transform(() => matrices.push(currentMatrix) && currentMatrix)
export const restore = transform(() => matrices.pop())
export const setTransform = transform(matrix => matrix)
export const resetTransform = transform(() => new DOMMatrix())
export const scale = transform((sx, sy) => currentMatrix.scale(sx, sy))
export const translate = transform((tx, ty) => currentMatrix.translate(tx, ty))

export const drawCustomObject = o => drawList.push(o)

let prevDraws = []
export const draw = () => {
  const toDraw = []
  let contaminations = []
  let matrix = new DOMMatrix()
  drawList.forEach(o => {
    if (typeof o === 'function') {
      toDraw.push(o)
      return
    }
    if (o instanceof DOMMatrix) {
      matrix = o
      return
    }
    let { x: ox, y: oy } = matrix.transformPoint(new DOMPoint(o.x, o.y))
    let { x: ox2, y: oy2 } = matrix.transformPoint(new DOMPoint(
      o.x + o.xd, o.y + o.yd))
    const { width, height } = getWindowData()
    let x = ox
    let y = oy
    let x2 = ox2
    let y2 = oy2
    if (x > x2) {
      const t = x
      x = x2
      x2 = t
    }
    if (y > y2) {
      const t = y
      y = y2
      y2 = t
    }
    if (o.pol && (x2 <= 0 || y2 <= 0 || x >= width || y >= height))
      return
    x = Math.max(x, 0)
    x2 = Math.min(x2, width)
    if (Math.abs(x - x2) <= 1) {
      if (o.pol){
        return
      } else {
        x--
        x2++
      }
    }
    y = Math.max(y, 0)
    y2 = Math.min(y2, height)
    if (Math.abs(y - y2) <= 1) {
      if (o.pol){
        return
      } else {
        y--
        y2++
      }
    }
    const ods = [ox, oy, ox2, oy2]
    const ds = [x, y, x2, y2]
    toDraw.push(o)
    const prevDrawIndex = prevDraws.indexOf(o)
    if (prevDrawIndex === -1) {
      o.shouldRedraw = true
    } else {
      o.shouldRedraw ||= !o.ods?.every((d, i) => d === ods[i])
      if (prevDrawIndex > 0) {
        contaminations.push(
          ...prevDraws.slice(0, prevDrawIndex).map(o => o.ds)
        )
      }
      if (o.shouldRedraw && o.ds)
        contaminations.push(o.ds)
      prevDraws.splice(0, 1 + prevDrawIndex)
    }
    if (o.shouldRedraw)
      contaminations.push(ds)
    o.ods = ods
    o.ds = ds
    o.matrix = matrix
  })
  contaminations.push(...prevDraws.map(o => o.ds))

  const mergedContaminations = []
  const range = []
  let lastStage = []
  let lastX
  contaminations
  .flatMap(([x1, y1, x2, y2]) => [[x1, y1, y2, 1], [x2, y1, y2, -1]])
  .sort(([xa], [xb]) => xa - xb)
  .forEach(([x, y1, y2, inc]) => {
    if (lastX !== x) {
      const currentStage = []
      let i = 0
      while (i < range.length - 1) {
        let item = range[i]
        const y1 = item[0]
        do { item = range[++i] } while (item[1] > 0)
        const y2 = item[0]
        i++
        const continuingBox = lastStage.find(box =>
          box[2] === lastX && box[1] === y1 && box[3] === y2)
        if (continuingBox) {
          currentStage.push(continuingBox)
          continuingBox[2] = x
        } else {
          const box = [lastX, y1, x, y2]
          currentStage.push(box)
          mergedContaminations.push(box)
        }
      }
      lastStage = currentStage
      lastX = x
    }
    let i = 0
    while (range[i]?.[0] < y1) i++
    const s = i
    while (range[i]?.[0] < y2) i++
    const e = i
    range.slice(s, e).forEach(a => a[1] += inc)
    const updateEdge = (v, i, inc) => {
      const item = range[i]
      const prevL = range[i - 1]?.[1] || 0
      if (!item || item[0] > v) {
        range.splice(i, 0, [v, prevL + inc])
        return 1
      }
      if (item[1] === prevL) {
        range.splice(i, 1)
        return -1
      }
      return 0
    }
    const delta = updateEdge(y1, s, inc)
    updateEdge(y2, e + delta, -inc)
  })


  const ctx = getCtx()
  toDraw.forEach(o => {
    if (typeof o === 'function') {
      o(ctx)
      return
    }
    const [ox, oy, ox2, oy2] = o.ods
    const ods = [ox, oy, ox2 - ox, oy2 - oy, ox2, oy2]
    const [x, y, x2, y2] = o.ds
    const ds = [x, y, x2 - x, y2 - y, x2, y2]
    if (o.shouldRedraw) {
      drawObject(ctx, o, ods, ds)
    } else {
      mergedContaminations.forEach(([cx, cy, cx2, cy2]) => {
        const ix = Math.max(cx, x)
        const iy = Math.max(cy, y)
        const ix2 = Math.min(cx2, x2)
        const iy2 = Math.min(cy2, y2)
        const ixd = ix2 - ix
        const iyd = iy2 - iy
        if (!o.pol || (ixd > 0 && iyd > 0))
          drawObject(ctx, o, ods, [ix, iy, ixd, iyd, ix2, iy2])
      })
    }
  })
  prevDraws = toDraw.filter(o => typeof o !== 'function')

  matrices = []
  drawList = []
}

export default () => createD(null, {
  x: [{ r: 0, v: [0, 0] }, { r: 1, v: [0, 1] }],
  y: [{ r: 0, v: [0, 0] }, { r: 1, v: [0, 1] }],
  xCache: { 0: [0, 0], 1: [0, 1] },
  yCache: { 0: [0, 0], 1: [0, 1] },
})
