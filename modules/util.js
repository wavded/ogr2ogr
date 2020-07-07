const path = require('path')
let tmpdir = require('os').tmpdir()
if (tmpdir === '/src') tmpdir = '/tmp' // docker issue

const fs = require('fs')
const rimraf = require('rimraf')
const drivers = require('./drivers.json')

exports.tmpl = function (tmpl, data) {
  for (let label in data) {
    tmpl = tmpl.replace('{{' + label + '}}', data[label])
  }
  return tmpl
}

let genInc = Date.now()
let genTmpPath = (exports.genTmpPath = function () {
  return path.join(tmpdir, 'ogr_' + (genInc++).toString(14))
})

exports.rmParentDir = function (fpath, cb) {
  rimraf(path.dirname(fpath), cb)
}
exports.rmDir = function (dpath, cb) {
  rimraf(dpath, cb)
}
exports.rmFile = function (fpath, cb) {
  fs.unlink(fpath, cb)
}

exports.getDriver = function (fmt) {
  for (let i = 0; i < drivers.length; i++) {
    if (drivers[i].format == fmt || drivers[i].aliases.indexOf(fmt) > -1)
      return drivers[i]
  }
  return {}
}

exports.writeStream = function (ins, ext, cb) {
  let fpath = genTmpPath() + '.' + ext
  let ws = fs.createWriteStream(fpath)
  let one = exports.oneCallback(cb)

  ins
    .pipe(ws)
    .on('error', one)
    .on('finish', function () {
      one(null, fpath)
    })
}

exports.writeGeoJSON = function (obj, cb) {
  let fpath = genTmpPath() + '.json'
  fs.writeFile(fpath, JSON.stringify(obj), function (er) {
    cb(er, fpath)
  })
}

exports.oneCallback = function (cb) {
  let called = false
  return function (er, data) {
    if (called) return
    called = true
    cb(er, data)
  }
}

exports.allCallback = function (cb) {
  let one = exports.oneCallback(cb)
  let expect = 0
  let total = 0

  setImmediate(function () {
    if (expect == 0) one(null, total)
  })

  return function () {
    expect++, total++
    return function (er) {
      if (er) return one(er)
      if (--expect == 0) one(null, total)
    }
  }
}
