
const setters = []
export const update = dt => setters.forEach(setter => setter(dt))

const fps = 30
const secondsPerFrame = 1 / fps
const maxUpdatedFrames = 5
const maxAccumulatedTime = maxUpdatedFrames * secondsPerFrame * 1000 * 1000
const step = 1000
const createAnimator = ({ advance, isAnimating, stopAnimating }) => {
  const tryAdvancing = dt => {
    const shouldAdvance = isAnimating()
    if (shouldAdvance)
      advance(dt)
    else
      stopAnimating()
    return shouldAdvance
  }
  // https://gafferongames.com/post/fix_your_timestep/
  let accumulator = 0
  setters.push(dt => {
    accumulator += dt
    accumulator = Math.min(accumulator, maxAccumulatedTime)

    while (accumulator > step) {
      accumulator -= step
      if (!tryAdvancing(step)) {
        accumulator = 0
        break
      }
    }
    if (accumulator)
      tryAdvancing(accumulator)
  })
}


export const inverse = (durationInSeconds, precision = 0.1) => {
  let x = 0
  let xDest = x

  const isAnimating = () => Math.abs(x - xDest) > precision
  const stopAnimating = () => x = xDest

  const advance = dt => {
    const dSec = dt / (1000 * 1000)
    const ratio = Math.min(1, dSec / durationInSeconds)
    x += (xDest - x) * ratio
  }

  createAnimator({ advance, isAnimating, stopAnimating })

  const inverse = {
    isAnimating,
    value: () => x,
    go: dest => {
      xDest = dest
      stopAnimating()
      return inverse
    },
    move: dest => {
      xDest = dest
      return inverse
    },
    shift: dest => {
      x = dest
      return inverse
    }
  }
  
  return inverse
}


export const spring = (stiffness, damping, precision = 0.1) => {
  let x = 0
  let xDest = x
  let v = 0

  const calcA = (v, x) => stiffness * (xDest - x) - damping * v
  const getA = () => calcA(v, x)

  // http://gafferongames.com/game-physics/integration-basics/
  const integrateSemiImplicitEuler = dSec => {
    v += getA() * dSec
    x += v * dSec
  }

  // http://gafferongames.com/game-physics/integration-basics/
  const integrateRK4 = dSec => {
    // "animated" does this differently. I think it's wrong.
    // https://github.com/animatedjs/animated/blob/master/src/SpringAnimation.js#L147
    const vArr = [v]
    const aArr = [getA()]

    ;[2, 2, 1].forEach((ratio, i) => {
      // https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods#The_Runge%E2%80%93Kutta_method
      const vCurrent = v + aArr[0] * dSec / ratio // or aArr[i]? I put aArr[0] because that was my understanding of the wikipedia article
      const aCurrent = calcA(vCurrent, x + vArr[i] * dSec / ratio)
      vArr.push(vCurrent)
      aArr.push(aCurrent)
    })

    const [a1, a2, a3, a4] = aArr
    const [v1, v2, v3, v4] = vArr
    v += (a1 + 2 * (a2 + a3) + a4) * dSec / 6
    x += (v1 + 2 * (v2 + v3) + v4) * dSec / 6
  }

  const isAnimating = () => Math.abs(v) > precision || Math.abs(x - xDest) > precision

  const stopAnimating = () => {
    v = 0
    x = xDest
  }

  const advance = dt => {
    const dSec = dt / (1000 * 1000)
    integrateRK4(dSec) // or integrateSemiImplicitEuler(dSec)
  }

  createAnimator({ advance, isAnimating, stopAnimating })

  const spring = {
    isAnimating,
    a: getA,
    v: () => v,
    value: () => x,
    go: dest => {
      xDest = dest
      stopAnimating()
      return spring
    },
    move: dest => {
      xDest = dest
      return spring
    },
    shift: dest => {
      x = dest
      return spring
    }
  }
  
  return spring
}

export default {
  scroll: inverse(0.2),
  darkMode: inverse(0.1),
}
