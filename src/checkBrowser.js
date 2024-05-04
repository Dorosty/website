
export default () => {
  const ua = navigator.userAgent
  const is = reg => reg.test(ua)
  const match = (reg = /version\/(\d+(\.?_?\d+)+)/i, i = 1) => ua.match(reg)?.[i]

  const isForbidden = [
    /opt\/\d+(?:.?_?\d+)+/i,
    /msie|trident/i,
    /\sedg\//i,
    /edg([ea]|ios)/i,
  ].some(test => is(test))

  const isMobile = !is(/like android/i) && [
    /Macintosh(.*?) FxiOS(.*?)\//,
    /opt\/\d+(?:.?_?\d+)+/i,
    /(ipod|iphone|ipad)/i,
    /android/i,
  ].some(test => is(test))

  const found = !isForbidden && [
    [/opera/i, 'opera', () => match() || match(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i)],
    [/opr\/|opios/i, 'opera', () => match(/(?:opr|opios)[\s/](\S+)/i) || match()],
    [/firefox|iceweasel|fxios/i, 'firefox', () => match(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i)],
    [/chromium/i, 'chrome', () => match(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i) || match()],
    [/chrome|crios|crmo/i, 'chrome', () => match(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i)],
  ].find(([test]) => is(test))

  const isSafari = !found && !is(/android/i) && is(/safari|applewebkit/i)

  const browser = found ? found[1] : isSafari ? 'safari' : null
  const version = found ? found[2]() : isSafari ? match() : null

  let outdatedText
  if (!browser) {
    outdatedText = { prompt: 'Your browser in not supported. Please switch to one of these other browsers:' }
  } else {
    let supportedVersion = ({
      chrome: [123, 61],
      firefox: 84,
      safari: 13,
      opera: [80, 48],
    })[browser]
    if (Array.isArray(supportedVersion))
      supportedVersion = supportedVersion[isMobile ? 0 : 1]
    if (version.slice(0, version.indexOf('.')) < supportedVersion) {
      const browserName = browser[0].toUpperCase() + browser.slice(1)
      outdatedText = {
        notice: `Your current version of ${browserName} is not supported. Keep your browser up to date for a better experience.`,
        cta: `Click to upgrade to the latest version of ${browserName}`,
        prompt: `...or download one of these other browsers:`,
      }
    }
  }
  if (outdatedText) {
    document.body.id = 'outdated';
    const link = document.createElement('link')
    link.rel = 'styleSheet'
    link.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css'
    document.head.appendChild(link)
    document.body.innerHTML = outdatedTemplate
      .replace('notice', outdatedText.notice)
      .replace('cta', outdatedText.cta)
      .replace('prompt', outdatedText.prompt)
    return false
  }
  return true
}
