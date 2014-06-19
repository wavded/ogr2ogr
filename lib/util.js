"use strict"
var path = require('path')
var tmpdir = require('os').tmpdir()
if (tmpdir === '/src') tmpdir = '/tmp' // docker issue

var fs = require('fs')
var rimraf = require('rimraf')
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

exports.rmParentDir = function (fpath, cb) { rimraf(path.dirname(fpath), cb) }
exports.rmDir       = function (dpath, cb) { rimraf(dpath, cb) }
exports.rmFile      = function (fpath, cb) { fs.unlink(fpath, cb) }

exports.getDriver = function (fmt) {
  for (var i = 0; i < drivers.length; i++) {
    if (drivers[i].format == fmt || drivers[i].aliases.indexOf(fmt) > -1) return drivers[i]
  }
  return {}
}

exports.writeStream = function (ins, ext, cb) {
  var fpath = genTmpPath()+'.'+ext
  var ws = fs.createWriteStream(fpath)
  var one = exports.oneCallback(cb)

  ins.pipe(ws)
    .on('error', one)
    .on('finish', function () {
      one(null, fpath)
    })
}

exports.writeGeoJSON = function (obj, cb) {
  var fpath = genTmpPath()+'.json'
  fs.writeFile(fpath, JSON.stringify(obj), function (er) {
    cb(er, fpath)
  })
}

exports.oneCallback = function (cb) {
  var called = false
  return function (er, data) {
    if (called) return
    called = true
    cb(er, data)
  }
}

// exports.chainCallback = function (/* args, cb */) {
//   var initArgs = Array.prototype.slice.call(arguments)
//   var cb = initArgs.pop()
//   initArgs.unshift(null)
// 
//   return function () {
//     var fns = Array.prototype.slice.call(arguments)
// 
//     function run (er, data) {
//       var fn = fns.shift()
//       if (!op || er) cb(er, data)
//       fn.call(null, er, data)
//     }
// 
//     initArgs.push(run)
//     fns.shift().apply(null, initArgs)
//   }
// }

exports.allCallback = function (cb) {
  var one = exports.oneCallback(cb)
  var expect = 0
  var total = 0

  setImmediate(function () { if (expect == 0) one(null, total) })

  return function () {
    expect++, total++
    return function (er) {
      if (er) return one(er)
      if (--expect == 0) one(null, total)
    }
  }
}
