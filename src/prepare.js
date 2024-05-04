
import * as paths from './paths'

Object.values(paths).forEach(path => {
  maxX = 0
  maxY = 0
  path.forEach(([command, ...args]) => {
    args.forEach((arg, i) => {
      if (i % 2 === 0)
        maxX = Math.max(arg, maxX)
      else
        maxY = Math.max(arg, maxY)
    })
  })
  path.maxX = maxX
  path.maxY = maxY
})

