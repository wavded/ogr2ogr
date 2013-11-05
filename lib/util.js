"use strict"
var genInc = Date.now()

exports.genId = function () {
  return 'ogr_'+(genInc++).toString(14)
}

exports.tmpl = function (tmpl, data) {
  for (var label in data) {
    tmpl = tmpl.replace('{{'+label+'}}', data[label])
  }
  return tmpl
}

exports.tmp = require('os').tmpdir()
