
const http = require('http')
const utils = require('./utils')

http.createServer(async (req, res) => {
  try {
    res.end(await utils.build())
  } catch (e) {
    console.log(new Date())
    console.log(e)
    res.end('error')
  }
}).listen(1234)

console.log('running')
