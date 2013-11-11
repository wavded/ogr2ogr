"use strict"
var path = require('path')
var fs = require('fs')
var unzip = require('unzip')
var archiver = require('archiver')
var util = require('./util')

exports.extract = function (fpath, cb) {
  var input = fs.createReadStream(fpath)
  var zipPath = util.genTmpPath()
  var one = util.oneCallback(cb)

  input
    .pipe(unzip.Extract({ path: zipPath }))
    .on('error', one)
    .on('close', function () {
      one(null, zipPath)
    })
}

var validOgrRe = /^\.(shp|kml|tab|itf|000|rt1|gml|vrt)$/i
exports.findOgrFile = function (dpath, cb) {
  fs.readdir(dpath, function (er, f) {
    var files = f.filter(function (file) { return validOgrRe.test(path.extname(file)) })
    if (!files.length) return cb(new Error('No valid files found'))
    cb(null, path.join(dpath, files[0]))
  })
}

exports.createZipStream = function (dpath) {
  var zs = archiver('zip')

  fs.readdir(dpath, function (er, files) {
    if (er) return zs.emit('error', er)

    files.forEach(function (file) {
      var f = fs.createReadStream(path.join(dpath, file))
      zs.append(f, { name: file })
    })
    zs.finalize(function (er) {
      if (er) zs.emit('error', er)
    })
  })

  return zs
}
