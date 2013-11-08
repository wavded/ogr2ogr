"use strict"
var path = require('path')
var tmpdir = require('os').tmpdir()
var fs = require('fs')
var when = require('when')
var nodefn = require('when/node/function')
var rimraf = nodefn.lift(require('rimraf'))
var unlink = nodefn.lift(fs.unlink)
var writeFile = nodefn.lift(fs.writeFile)
var drivers = require('./drivers.json')

exports.tmpl = function (tmpl, data) {
  for (var label in data) {
    tmpl = tmpl.replace('{{'+label+'}}', data[label])
  }
  return tmpl
}

var genInc = Date.now()
var genTmpPath = exports.genTmpPath = function () {
  return path.join(tmpdir, 'ogr_'+(genInc++).toString(14))
}
exports.emitErr = function (ee) {
  return function (er) { if (er) ee.emit('error', er) }
}

exports.rmParentDir = function (fpath) {
  return rimraf(path.dirname(fpath))
}

exports.rmDir = function (dpath) {
  return rimraf(dpath)
}

exports.rmFile = function (fpath) {
  return unlink(fpath)
}

exports.getDriver = function (fmt) {
  for (var i = 0; i < drivers.length; i++) {
    if (drivers[i].format == fmt || drivers[i].aliases.indexOf(fmt) > -1) return drivers[i]
  }
  return {}
}

exports.writeStream = function (ins, ext) {
  var d = when.defer()
  var fpath = genTmpPath()+'.'+ext
  var ws = fs.createWriteStream(fpath)
  ins.pipe(ws)
    .on('error', d.reject)
    .on('finish', function () {
      d.resolve(fpath)
    })
  return d.promise
}

exports.writeGeoJSON = function (obj) {
  var fpath = genTmpPath()+'.json'
  return writeFile(fpath, JSON.stringify(obj))
    .then(function () {
      return fpath
    })
}
