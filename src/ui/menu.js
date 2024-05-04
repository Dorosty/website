
import { getWindowData, setCursor } from '../global'
import colors from '../colors'
import animations, { inverse } from '../animations'
import createLerper from '../lerp'
import d, {
  createGradient,
  save,
  restore,
  resetTransform,
  translate,
  scale,
} from '../d'
import { getObjects as getContactObjects } from './contact'



let desktopObjects, mobileObjects
const getObjects = (isMobile, { title, frontend }) => {
  const createObjects = (xm, y, ya = 0) => {
    const linkedin = frontend.new().xm(xm).y(y).ya(ya).xd(40).yd(40)
    const resume = linkedin.new().sxp.xpa(80)
    const email = linkedin.new().sx.xa(80)
    const toggle = linkedin.new().sy.ya(150).xm.xd(120)
    const toggleLight = toggle.new().sxp.x2.xd(40).xpa(20)
    const toggleDark = toggle.new().sx.x.xd(40).xa(20)
    const getBackground = item => item.new().qxp(10).qyp(10)
    const linkedinBg = getBackground(linkedin)
    const resumeBg = getBackground(resume)
    const emailBg = getBackground(email)
    const toggleBg = getBackground(toggle)
    const toggleLightBg = getBackground(toggleLight)
    const toggleDarkBg = getBackground(toggleDark)
    const chipLight = toggle.new().qy(5).xa(5).xd(30)
    const chipDark = chipLight.new().x2p(toggle, 5)
    const chipRange = chipDark.x - chipLight.x
    return {
      linkedin, resume, email, toggle, toggleLight, toggleDark, getBackground,
      linkedinBg, resumeBg, emailBg, toggleBg, toggleLightBg, toggleDarkBg,
      chipLight, chipDark, chipRange,
    }
  }
  return isMobile
    ? mobileObjects ||= createObjects('0.75', title.y)
    : desktopObjects ||= createObjects('0.5', frontend.y2, 50)
}

export const getToggleDesktop = frontend => getObjects(false, { frontend }).toggle

const menu = d().y.yd(50)

const sh = a => a * 5 / 8
const sh1 = sh(1)
const toggleDarkShrunk = d().y(10).x2p(10).xd(sh(40)).yd(sh(40))
const toggleShrunk = toggleDarkShrunk.new().sxp.x2.xd(sh(120)).xpa(10)
const toggleLightShrunk = toggleShrunk.new().sxp.x2.xd(sh(40)).xpa(10)
const emailShrunk = toggleLightShrunk.new().sxp.xpa(50)
const linkedinShrunk = emailShrunk.new().sxp.xpa(20)
const resumeShrunk = linkedinShrunk.new().sxp.xpa(10)
const chipLightShrunk = toggleShrunk.new().qy(sh(5)).xa(sh(5)).xd(sh(30))
const chipDarkShrunk = chipLightShrunk.new().x2p(toggleShrunk, sh(5))
const chipRangeShrunk = chipDarkShrunk.x - chipLightShrunk.x

const colorAnims = {
  linkedin: inverse(0.1),
  email: inverse(0.1),
  resume: inverse(0.1),
  toggle: inverse(0.1),
  toggleDrag: inverse(0.1),
  toggleLight: inverse(0.1),
  toggleDark: inverse(0.1),
}

let hasChipBeenDragged = false
let darkMode = false
let darkModeU = false
let isDragging = null
export const isDraggingToggle = () => isDragging
const lrp = createLerper('titleRest', 'titleGrow', 'contact', 'contactRest')
const vLrp = createLerper('subtitle', 'titleRest')
const lerp = (init, shrunk, final) => lrp(init, shrunk, shrunk, final)

export default (isMobile, firstSectionObjects) => {
  const visibility = vLrp(0, 1)
  if (visibility === 0) return

  const {
    linkedin, resume, email, toggle, toggleLight, toggleDark, getBackground,
    linkedinBg, resumeBg, emailBg, toggleBg, toggleLightBg, toggleDarkBg,
    chipLight, chipDark, chipRange,
  } = getObjects(isMobile, firstSectionObjects)

  const { isTouch, mouseLocation, mouseDown, mouseUp } = getWindowData()

  menu.drawRect(colors.bg)

  const getGradient = (color, op = 1) => {
    if (visibility === 1)
      return color
    const dy = 400
    return createGradient(
      resume.x2, toggle.ym - dy,
      linkedin.x1, email.ym + dy,
      [0, color.op(op)],
      [Math.max(0, visibility - 0.1), color.op(op)],
      [visibility, color.op(0)],
      [1, color.op(0)],
    )
  }

  let state = lerp(0, 1, 2)
  if (state > 1.9) state = 2 // fixme
  const isTransitioning = 0 < state && state < 1
  const isTransitioning2 = isTransitioning || (1 < state && state < 2)
  const isShrunk = state >= 1
  const isLinksActive = state > 1

  const sc = lerp(1, sh1, 1)
  const sc2 = lerp(1, sh1, sh1)

  const defaultColor = 'n1'
  const defaultGradient = getGradient(colors[defaultColor])

  save()

  const {
    linkedinIcon: linkedinFinal,
    resumeIcon: resumeFinal,
    emailIcon: emailFinal,
    linkedinLink,
    resumeLink,
    emailLink,
  } = getContactObjects()

  ;[
    [linkedin, linkedinBg, linkedinShrunk, 'n1', colorAnims.linkedin, {
      path: 'linkedin', final: linkedinFinal,
      link: [linkedinLink, '//linkedin.com/in/ali-dorosty'],
    }],
    [resume, resumeBg, resumeShrunk, 'n1', colorAnims.resume, {
      path: 'resume', final: resumeFinal,
      link: [resumeLink, '//raw.githubusercontent.com/Dorosty/website/main/docs/Ali Dorosty.pdf'],
    }],
    [email, emailBg, emailShrunk, 'n1', colorAnims.email, {
      path: 'email', final: emailFinal,
      link: [emailLink, 'mailto:ma.dorosty@gmail.com'],
    }],
    [toggle, toggleBg, toggleShrunk, 'n3', colorAnims.toggle, {
      hoverColorName: 'n2', rad: 20
    }],
    [toggleDark, toggleDarkBg, toggleDarkShrunk, 'n2', colorAnims.toggleDark, {
      path: 'moon'
    }],
    [toggleLight, toggleLightBg, toggleLightShrunk, 'n2', colorAnims.toggleLight, {
      path: 'sun'
    }],
  ].forEach(([
    item, itemBackground, itemShrunk, colorName, colorAnim, {
      hoverColorName = 'fg',
      final: itemFinal,
      link: [itemLink, link] = [],
      rad,
      path,
    } = {},
  ]) => {
    restore()
    save()
    const dxd = (1 - sh1) * item.xd / 2
    const dyd = (1 - sh1) * item.yd / 2
    translate(
      lerp(0, itemShrunk.x - dxd - item.x,
        (link ? itemFinal.x : itemShrunk.x - dxd) - item.x),
      lerp(0, itemShrunk.y - dyd - item.y,
        (link ? itemFinal.y : itemShrunk.y - dyd) - item.y))
    translate(item.xm, item.ym)
    const scFinal = link ? sc : sc2
    scale(scFinal, scFinal)
    translate(-item.xm, -item.ym)

    colorAnim.move(0)
    if (link ? isTransitioning : isTransitioning2) {
      // drawFn(ctx => ctx.filter = 'blur(10px)')
      itemBackground.drawRect(colors.bg.op(Math.min(1, lerp(0, 3, 0))), 10)
      // drawFn(ctx => ctx.filter = 'none')
    } else {
      const hitbox = state === 0 ? item : state === 1 ? itemShrunk
        : itemLink || itemShrunk
      if (hitbox.in() && !isTouch) {
        colorAnim.move(1)
        setCursor('pointer')
      }
    }

    let color = colors[colorName]
    let isDefaultColor = colorName === defaultColor
    const colorAnimValue = colorAnim.value()
    if (colorAnimValue) {
      color = color.mix(colors[hoverColorName], colorAnimValue)
      isDefaultColor = false
    }
    if (link && isLinksActive) {
      color = color.mix(colors.fg, state - 1)
      isDefaultColor = false
    }
    if (isDefaultColor) color = defaultGradient
    else if (visibility !== 1) color = getGradient(color)

    if (path)
      item.drawPath(color, path)
    else
      item.drawRect(color, rad)

    if ([0, 1].includes(state) && link)
      (state ? itemShrunk : item).link(link)
  })

  const s = (a, b) => isShrunk ? b : a
  const chipRangeCurrent = s(chipRange, chipRangeShrunk)

  const chipColor = visibility === 1
    ? colors.n4 : getGradient(colors.n4)

  let chipRatio, chipRegion
  const setChipToDraw = (xa, hasAnimation = true) => {
    const animRatio = animations.darkMode.value()
    chipRatio = xa == null ? animRatio
      : Math.max(0, Math.min(1, xa / chipRangeCurrent))
    if (hasAnimation)
      chipRatio = Math[darkModeU ? 'max' : 'min'](chipRatio, animRatio)
    else if (xa != null)
      animations.darkMode.go(chipRatio)
    xa = chipRatio * chipRange
    chipRegion = chipLight.xa(xa)
  }

  if (isTransitioning2) {
    setChipToDraw()
    chipRegion.drawRect(chipColor, 15)
    restore()
    return
  }

  const chipDarkCurrent = s(chipDark, chipDarkShrunk)
  const chipLightCurrent = s(chipLight, chipLightShrunk)
  const toggleCurrent = s(toggle, toggleShrunk)
  const toggleLightCurrent = s(toggleLight, toggleLightShrunk)
  const toggleDarkCurrent = s(toggleDark, toggleDarkShrunk)
  const chipCurrent = darkMode ? chipDarkCurrent : chipLightCurrent

  const isDown = toggleCurrent.in(mouseDown)
  isDragging = isDown && chipCurrent.in(mouseDown) && !isTouch
  if (isDragging) {
    setCursor('pointer')
    colorAnims.toggleDrag.move(1)
  } else {
    colorAnims.toggleDrag.move(0)
  }
  const dragAnim = colorAnims.toggleDrag.value()
  if (dragAnim) {
    toggle.drawRect(
      visibility === 1
        ? colors.n1.op(dragAnim) :
        getGradient(colors.n1, dragAnim),
      20)
  }

  const updateToggleAnimation = () => animations.darkMode.move(darkModeU ? 1 : 0)
  if (isDragging) {
    const margin = 30 * sh1
    const dx = mouseLocation.x - chipLightCurrent.xm
    if (dx <= margin) {
      darkModeU = false
      updateToggleAnimation()
      setChipToDraw(dx)
    } else if (dx >= chipRangeCurrent - margin) {
      darkModeU = true
      updateToggleAnimation()
      setChipToDraw(dx)
    } else {
      hasChipBeenDragged = true
      setChipToDraw(dx, false)
    }
  } else {
    if (toggleLightCurrent.in(mouseDown) && toggleLightCurrent.in(mouseUp))
      darkMode = darkModeU = false
    else if (toggleDarkCurrent.in(mouseDown) && toggleDarkCurrent.in(mouseUp))
      darkMode = darkModeU = true
    else if (isDown && !hasChipBeenDragged && toggleCurrent.in(mouseUp))
      darkMode = darkModeU = !darkMode
    else
      darkMode = darkModeU
    hasChipBeenDragged = false
    updateToggleAnimation()
    setChipToDraw()
  }

  const chipRegionCurrent = s(chipRegion,
    chipLightShrunk.xa(chipRangeShrunk * chipRatio))

  if (isDragging && !chipRegionCurrent.in()) {
    save()
    resetTransform()
    d().x(mouseLocation.x).y(mouseLocation.y)
      .x2(chipRegionCurrent.xm).y2(chipRegionCurrent.ym)
      .drawLine(colors.n1, 1)
    restore()
  }

  chipRegion.drawRect(chipColor, 15)

  restore()
}
