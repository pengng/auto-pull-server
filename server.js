var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var config = require(process.argv[2])
var Hook = require('./lib/coding')
var async = require('async')
var logger = require('express-req-logger')

var repository = config.repository || []
var hooks = repository.map(function (item) {
  return new Hook(item)
})

app.use(logger())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.post('/', function (req, res, next) {
  var eventType = getHeaders(req.headers, 'x-coding-event') || req.body.event
  var body = req.body
  var data = {
    https_url: body.repository ? body.repository.https_url : '',
    ssh_url: body.repository ? body.repository.ssh_url : '',
    ref: body.ref || '',
    token: body.token || ''
  }
  if (eventType === 'push') {
    async.map(hooks, function (item, next) {
      item.pull(data, next)
    }, function (err, result) {
      if (err) {
        return res.status(500).send(err)
      }
      console.log(result.join(''))
      res.end()
    })
  } else {
    res.end()
  }
})

var getHeaders = function (headers, name) {
  var reg = new RegExp(name, 'i')
  for (var key in headers) {
    if (reg.test(key)) {
      return headers[key]
    }
  }
}

var port = config.port || 4000

app.listen(port, () => {
  console.log('server start at ' + port)
})
