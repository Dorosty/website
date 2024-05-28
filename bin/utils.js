
const fs = require('fs')
const esbuild = require('esbuild')
const isWorkerEnabled = require('../_isWorkerEnabled').default

exports.build = async isProduction => {
  const read = file => fs.promises.readFile(file).then(file => file.toString())

  const build = async file => {
    let { outputFiles: [{ text }] } = await esbuild.build({
      entryPoints: [file],      
      target: 'es2015',
      bundle: true,
      write: false,
      format: 'cjs',
      minify: isProduction,
    })
    if (isProduction)
      text = text.trim().replace(/\n/g, '\\n')
    return text
  }

  const [
    template,
    outdatedTemplate,
    outdatedBrowserPromptTemplate,
    mainCode,
    workerCode,
  ] = await Promise.all([
    read('bin/template.html'),
    read('bin/outdated.html'),
    read('bin/outdated-browser-prompt.html'),
    build('src/index.js'),
    build('src/worker.js'),
  ])

  let workerCodeString = workerCode.replace(/\\/g, '\\\\')
  workerCodeString = isProduction
    ? "'" + workerCodeString.replace(/\'/g, '\\\'') + "'"
    : '`' + workerCodeString.replace(/\`/g, '\\\`').replace(/\$/g, '\\\$') + '`'

  const outTemplateString = "'" + outdatedTemplate.replace(/\n */g, '') + "'"
  const outBrowserTemplateString = "'" + outdatedBrowserPromptTemplate.replace(/\n */g, '') + "'"

  let html = isProduction ? template.trim().replace(/\n */g, '') : template
  html = html.replace(
    '{{jsCode}}', isWorkerEnabled
      ? 'var workerCode = workerCodeString;mainCode'
      : '(function(){workerCode})();(function(){mainCode})()'
    )
    .replace('mainCode', () => mainCode)
    .replace('outdatedTemplate', () => outTemplateString)
    .replace('outdatedBrowserPromptTemplate', () => outBrowserTemplateString)

  return isWorkerEnabled
    ? html.replace('workerCodeString', () => workerCodeString)
    : html.replace('workerCode', () => workerCode)
}
