"use strict"
var path = require('path')
var fs = require('fs')
var when = require('when')
var nodefn = require('when/node/function')
var readdir = nodefn.lift(fs.readdir)
var rimraf = nodefn.lift(require('rimraf'))
var unzip = require('unzip')
var archiver = require('archiver')
var util = require('./util')

var extRe = /^\.(shp|kml|tab|itf|000|rt1|gml|vrt)$/i

exports.extractZip = function (fpath) {
  var d = when.defer()
  var ins = fs.createReadStream(fpath)
  var zipPath = util.genTmpPath()

  ins
    .pipe(unzip.Extract({ path: zipPath }))
    .on('close', d.resolve)
    .on('error', d.reject)

  return d.promise
    .then(function () {
      return readdir(zipPath)
    })
    .then(function (f) {
      var files = f.filter(function (file) { return extRe.test(path.extname(file)) })
      if (!files.length) throw new Error('No valid files found')
      return path.join(zipPath, files[0])
    })
}

exports.cleanZip = function (fpath) {
  return rimraf(path.dirname(fpath))
}

exports.cleanZipStream = function (dpath) {
  return rimraf(dpath)
}

exports.makeZipStream = function (dpath) {
  var zs = archiver('zip')

  readdir(dpath)
    .then(function (files) {
      files.forEach(function (file) {
        var f = fs.createReadStream(path.join(dpath, file))
        zs.append(f, { name: file })
      })
      zs.finalize(function (er, bytes) {
        zs.emit('error', er)
      })
    }, function (er) {
      zs.emit('error', er)
      zs.finalize()
    })

  return zs
}
