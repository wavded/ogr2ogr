"use strict"
var path = require('path')
var tmpdir = require('os').tmpdir()

exports.tmpl = function (tmpl, data) {
  for (var label in data) {
    tmpl = tmpl.replace('{{'+label+'}}', data[label])
  }
  return tmpl
}

var genInc = Date.now()
exports.genTmpPath = function () {
  return path.join(tmpdir, 'ogr_'+(genInc++).toString(14))
}
