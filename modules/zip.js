const path = require('path')
const fs = require('fs')
const findit = require('findit')
const DecompressZip = require('decompress-zip')
const archiver = require('archiver')
const util = require('./util')

exports.extract = function (fpath, cb) {
  let zip = new DecompressZip(fpath)
  let zipPath = util.genTmpPath()
  let one = util.oneCallback(cb)

  zip
    .on('extract', function () {
      one(null, zipPath)
    })
    .on('error', one)
    .extract({path: zipPath})
}

let validOgrRe = /^\.(shp|kml|tab|itf|000|rt1|gml|vrt)$/i
let macosxRe = /__MACOSX/
exports.findOgrFile = function (dpath, cb) {
  let finder = findit(dpath)
  let found

  finder.on('file', function (file) {
    if (!macosxRe.test(file) && validOgrRe.test(path.extname(file)))
      found = file
  })
  finder.on('error', function (er) {
    cb(er)
    finder.stop() // prevent multiple callbacks, stop at first error
  })
  finder.on('end', function () {
    if (!found) return cb(new Error('No valid files found'))
    cb(null, found)
  })
}

exports.createZipStream = function (dpath) {
  let zs = archiver('zip')

  fs.readdir(dpath, function (er, files) {
    if (er) return zs.emit('error', er)

    files.forEach(function (file) {
      let f = fs.createReadStream(path.join(dpath, file))
      zs.append(f, {name: file})
    })
    zs.finalize(function (er2) {
      if (er2) zs.emit('error', er2)
    })
  })

  return zs
}
