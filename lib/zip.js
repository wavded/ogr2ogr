"use strict"
var path = require('path')
var fs = require('fs')
var when = require('when')
var nodefn = require('when/node/function')
var readdir = nodefn.lift(fs.readdir)
var unzip = require('unzip')
var archiver = require('archiver')
var util = require('./util')

exports.extract = function (fpath) {
  var d = when.defer()
  var input = fs.createReadStream(fpath)
  var zipPath = util.genTmpPath()

  input
    .pipe(unzip.Extract({ path: zipPath }))
    .on('error', d.reject)
    .on('close', function () { d.resolve(zipPath) })

  return d.promise
}

var validOgrRe = /^\.(shp|kml|tab|itf|000|rt1|gml|vrt)$/i
exports.findOgrFile = function (dpath) {
  return readdir(dpath)
    .then(function (f) {
      var files = f.filter(function (file) { return validOgrRe.test(path.extname(file)) })
      if (!files.length) throw new Error('No valid files found')
      return path.join(dpath, files[0])
    })
}

exports.createZipStream = function (dpath) {
  var zs = archiver('zip')

  readdir(dpath)
    .then(function (files) {
      files.forEach(function (file) {
        var f = fs.createReadStream(path.join(dpath, file))
        zs.append(f, { name: file })
      })
    })
    .otherwise(util.emitErr(zs))
    .ensure(function () {
      zs.finalize(util.emitErr(zs))
    })

  return zs
}
