var path = require('path')
var fs = require('fs')
var findit = require('findit')
var DecompressZip = require('decompress-zip')
var archiver = require('archiver')
var util = require('./util')

exports.extract = function(fpath, cb) {
  var zip = new DecompressZip(fpath)
  var zipPath = util.genTmpPath()
  var one = util.oneCallback(cb)

  zip
    .on('extract', function() {
      one(null, zipPath)
    })
    .on('error', one)
    .extract({path: zipPath})
}

var validOgrRe = /^\.(shp|kml|tab|itf|000|rt1|gml|vrt)$/i
var macosxRe = /__MACOSX/
exports.findOgrFile = function(dpath, cb) {
  var finder = findit(dpath)
  var found

  finder.on('file', function(file) {
    if (!macosxRe.test(file) && validOgrRe.test(path.extname(file))) found = file
  })
  finder.on('error', function(er) {
    cb(er)
    finder.stop() // prevent multiple callbacks, stop at first error
  })
  finder.on('end', function() {
    if (!found) return cb(new Error('No valid files found'))
    cb(null, found)
  })
}

exports.createZipStream = function(dpath) {
  var zs = archiver('zip')

  fs.readdir(dpath, function(er, files) {
    if (er) return zs.emit('error', er)

    files.forEach(function(file) {
      var f = fs.createReadStream(path.join(dpath, file))
      zs.append(f, {name: file})
    })
    zs.finalize(function(er2) {
      if (er2) zs.emit('error', er2)
    })
  })

  return zs
}
