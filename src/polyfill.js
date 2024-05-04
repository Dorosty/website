
window.OffscreenCanvas ||= function (w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
