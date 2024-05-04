
const fs = require('fs')
const utils = require('./utils')

utils.build(true).then(page =>
  fs.writeFile('docs/index.html', page, () => console.log('done')))
