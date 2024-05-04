
import animations from './animations'


const colors = {
  bg: ['fafbfe', '01040f'],
  fg: ['212d59', 'ffe6bc'],
  text: ['1c274d', 'fff5e4'],
  highlight: ['44538a', 'ffb128'],
  n1: ['bec0c4', 'd1d6e8'],
  n2: ['eaecf0', 'b4bace'],
  n3: ['f2f4f7', '8a8fa1'],
  n4: ['fefefe', '465481'],
  link: ['00f', 'fa0'],
}

let cache = {}
export const invalidateColorCache = () => { cache = {} }

const smartColors = {}
const addProperties = color => {
  color.isColor = true
  color.toString = () => color.hex
  Object.defineProperty(color, 'hex', { get() {
    if (color.cacheHex) return color.cacheHex
    color.cacheHex = '#' + color.map(a => ('0' + a.toString(16)).slice(-2)).join('')
    return color.cacheHex
  } })
  Object.defineProperty(color, 'joined', { get() {
    if (color.cacheJoined) return color.cacheJoined
    color.cacheJoined = color.join(',')
    return color.cacheJoined
  } })
  color.mix = (color2, r) => {
    if (r == 0) return color
    if (r == 1) return color2
    const result = color.map((l, i) => Math.round(l + r * (color2[i] - l)))
    addProperties(result)
    return result
  }
  color.op = op => ({
    isColor: true,
    isTransparent: op < 1,
    toString: () => `rgba(${color.joined}, ${op})`
  })
  return color
}
Object.entries(colors).forEach(([name, [light, dark]]) => {
  const toColorArray = color => {
    if (color.length === 3)
      color = color.split('').map(a => a + a).join('')
    return [0, 1, 2].map(i => parseInt(color.slice(i * 2, i * 2 + 2), 16))
  }
  light = toColorArray(light)
  dark = toColorArray(dark)
  addProperties(light)
  addProperties(dark)
  Object.defineProperty(smartColors, name, { get() {
    const r = animations.darkMode.value()
    if (r == 0) return light
    if (r == 1) return dark
    const cacheValue = cache[name]
    if (cacheValue) return cacheValue
    const result = light.mix(dark, r)
    cache[name] = result
    return result
  } })
})
export default smartColors
