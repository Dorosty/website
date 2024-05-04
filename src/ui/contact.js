
import createLerper from '../lerp'
import colors from '../colors'
import d from '../d'


let desktopObjects, mobileObjects
export const getObjects = () => {
  const codeTxt = 'I also encourage you to check out this page’s source code on GitHub. It’s all hand-crafted in vanilla Javascript and no external libraries are used.'
  let title = d().y(128).txt(80, 'Get In Touch', { xal: 'd', yal: 'd' })
  let email = title.new().sy.ya(50).txt(30, 'ma.dorosty@gmail.com', { yal: 'd' })
  let linkedin = email.new().sy.ya(50).txt(30, 'linkedin.com/in/ali-dorosty', { yal: 'd' })
  let resume = linkedin.new().sy.ya(50).txt(30, 'download my resume', { yal: 'd' })
  let code = resume.new().sy.ya(100).xd(title).txt(20, codeTxt, { xal: 'm' })

  const getResult = () => {
    email = email.x(title, 50)
    linkedin = linkedin.x2(email)
    resume = resume.x2(email)
    const getIcon = item => item.new().xpa(55).xd(40).ypa(4)
    const emailIcon = getIcon(email)
    const linkedinIcon = getIcon(linkedin)
    const resumeIcon = getIcon(resume)
    const getLink = (item, itemIcon) => item.new().x2.x1(itemIcon).qxp(15).qyp(15).ypa(7)
    const emailLink = getLink(email, emailIcon)
    const linkedinLink = getLink(linkedin, linkedinIcon)
    const resumeLink = getLink(resume, resumeIcon)
    return { title, email, emailIcon, emailLink, linkedin, linkedinIcon, linkedinLink, resume, resumeIcon, resumeLink, code }
  }
  if (code.y2p < 64) {
    if (!mobileObjects) {
      title = title.x2('0.5', -32)
      code = code.x('0.5', 32).y(email)
      mobileObjects = getResult()
    }
    return mobileObjects
  } else {
    if (!desktopObjects) {
      title = title.xm('0.5')
      code = code.x(title)
      desktopObjects = getResult()
    }
    return desktopObjects
  }
}

const lerp = createLerper('contact')
let githubLink = d()

export default () => {
  const op = lerp(0, 1)
  if (!op) return

  let tya = lerp(200, 150, 0)
  const ya = lerp(50, 30, 0)
  const opl = lerp(0, 0.8, 1)
  const [op1, op2, op3, op4] = Array(4).fill().map((_, exp) => {
    exp++
    const base = Math.pow(1000, exp)
    return (Math.pow(base + 1, opl) - 1) / base
  })

  let { title, email, emailLink, linkedin, linkedinLink, resume, resumeLink, code } = getObjects()

  title.ya(tya).drawText(colors.fg.op(op))
  tya += ya
  email.ya(tya).drawText(colors.fg.op(op1))
  emailLink.ya(tya).link('mailto:ma.dorosty@gmail.com')
  tya += ya
  linkedin.ya(tya).drawText(colors.fg.op(op2))
  linkedinLink.ya(tya).link('//linkedin.com/in/ali-dorosty')
  tya += ya
  resume.ya(tya).drawText(colors.fg.op(op3))
  resumeLink.ya(tya).link('//raw.githubusercontent.com/Dorosty/website/main/docs/Ali Dorosty.pdf')

  tya += ya
  code = code.ya(tya)
  code.drawText(colors.fg.op(op4), {
    onWord({ word, x, y, width, height }) {
      if (word === 'GitHub.') {
        githubLink = githubLink.x(code.x + x).y(code.y + y).xd(width).yd(height)
        githubLink.xpa(3).ypa(3).link('//github.com/Dorosty/website')
        githubLink.txt(20, word).drawText(colors.link.op(op4))
        return false
      }
    },
  })
}
