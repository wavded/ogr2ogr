"use strict"
var path = require('path')
var cp = require('child_process')
var stream = require('stream')
var when = require('when')
var zip = require('./lib/zip')
var csv = require('./lib/csv')

module.exports = function (fpath, opts) {
  if (!fpath) throw new Error('Path is required')
  opts || (opts = {})

  opts.sourceSrs || (opts.sourceSrs = 'EPSG:4326')
  opts.targetSrs || (opts.targetSrs = 'EPSG:4326')
  opts.format || (opts.format = 'GeoJSON')

  var isZip = /zip|kmz/.test(path.extname(fpath))
  var isCsv = /csv/.test(path.extname(fpath))

  var ostream = new stream.PassThrough()
  var action = isZip ? zip.extractZip(fpath) : isCsv ? csv.generateVrt(fpath) : fpath

  when(action)
    .then(function (ogrPath) {
      var d = when.defer()
      var s = cp.spawn('ogr2ogr', [
        '-f', opts.format, '-skipfailures',
        '-s_srs', opts.sourceSrs,
        '-t_srs', opts.targetSrs,
        '-a_srs', opts.targetSrs,
        '/vsistdout/', ogrPath
      ])
      s.stdout.pipe(ostream)

      s.stderr.setEncoding('ascii')
      s.stderr.on('readable', function () {
        var er = s.stderr.read() || ''
        if (er) ostream.emit('ogrerror', new Error(er))
      })
      s.on('error', d.reject)
      s.on('close', d.resolve)

      return d.promise
        .ensure(function () {
          if (isZip) return zip.cleanZip(ogrPath)
          if (isCsv) return csv.cleanVrt(ogrPath)
        })
    })
    .otherwise(function (er) {
      ostream.emit('error', er)
    })

  return ostream
}
