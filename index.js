"use strict"
var path = require('path')
var cp = require('child_process')
var when = require('when')
var nodefn = require('when/node/function')
var zip = require('./lib/zip')
var csv = require('./lib/csv')
var formats = require('./lib/formats')
var util = require('./lib/util')

var PassThrough = require('stream').PassThrough

function ogr2ogr (fpath, opts) {
  if (!fpath) throw new Error('A file path is required')
  opts || (opts = {})

  opts.sourceSrs || (opts.sourceSrs = 'EPSG:4326')
  opts.targetSrs || (opts.targetSrs = 'EPSG:4326')
  opts.format || (opts.format = 'GeoJSON')

  var config = formats[opts.format] || {}

  var isZipIn = /zip|kmz/.test(path.extname(fpath))
  var isCsvIn = /csv/.test(path.extname(fpath))
  var isZipOut = config.useZipOutStream

  var ogrOutPath = isZipOut ? util.genTmpPath() : '/vsistdout/'

  function logCommand (args) {
    // console.error.apply(null, ['ogr2ogr'].concat(args))
    return args
  }

  function run () {
    var ostream = new PassThrough()
    var getOgrInPath = isZipIn ? zip.extract(fpath).then(zip.findOgrFile)
                     : isCsvIn ? csv.makeVrt(fpath)
                     : when(fpath)

    getOgrInPath
      .then(function (ogrInPath) {
        var d = when.defer()
        var s = cp.spawn('ogr2ogr', logCommand([
          '-f', opts.format, '-skipfailures',
          '-s_srs', opts.sourceSrs,
          '-t_srs', opts.targetSrs,
          '-a_srs', opts.targetSrs,
          ogrOutPath, ogrInPath
        ]))

        if (!isZipOut) s.stdout.pipe(ostream)

        s.stderr.setEncoding('ascii')
        s.stderr.on('data', function (chunk) {
          var msg = chunk.split('\n')[0]
          if (msg.match(/GeoJSON driver|Warning/)) return
          d.reject(new Error(msg))
        })
        s.on('error', d.reject)
        s.on('close', d.resolve)

        return d.promise
          .then(function () {
            if (!isZipOut) return
            var sd = when.defer()
            var zs = zip.createZipStream(ogrOutPath)
            zs.pipe(ostream)
            zs.on('error', d.reject)
            zs.on('end', d.resolve)
            return sd
          })
          .ensure(function () {
            return when.join(
              isZipIn ? util.rmParentDir(ogrInPath) : '',
              isCsvIn && /vrt/.test(ogrInPath) ? util.rmFile(ogrInPath) : '',
              isZipOut ? util.rmDir(ogrOutPath) : ''
            )
          })
      })
      .otherwise(function (er) {
        // console.error(er)
        ostream.emit('error', er)
      })

    return ostream
  }

  return {
    stream: function () { return run() },
    exec: function (cb) {
      var d = when.defer()
      var buf = []

      run()
        .on('data', function (chunk) { buf.push(chunk) })
        .on('error', d.reject)
        .on('end', function () {
          var data = Buffer.concat(buf)
          if (opts.format == 'GeoJSON') {
            try { data = JSON.parse(data) } catch (e) { d.reject(e) }
          }
          d.resolve(data)
       })

      if (cb) nodefn.bindCallback(d.promise, cb)
      return d.promise
    }
  }
}

module.exports = ogr2ogr
