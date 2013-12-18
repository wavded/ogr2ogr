"use strict"
var path = require('path')
var cp = require('child_process')
var zip = require('./lib/zip')
var csv = require('./lib/csv')
var util = require('./lib/util')
var stream = require('stream')

function logCommand (args) {
  // console.error.apply(null, ['ogr2ogr'].concat(args))
  return args
}

module.exports = Ogr2ogr

function Ogr2ogr (mixed, fmt) {
  if (!(this instanceof Ogr2ogr)) return new Ogr2ogr(mixed, fmt)

  if (!mixed)
    throw new Error('A file path, stream, or GeoJSON object is required')

  if (mixed instanceof stream) {
    var driver = util.getDriver(fmt || path.extname(mixed.path).replace('.',''))
    if (!driver) throw new Error('Streams require a valid input format')
    this._inStream = mixed
    this._inDriver = driver
  }
  else if (typeof mixed == 'object') {
    this._inGeoJSON = mixed
  }
  else {
    this._inPath = mixed
  }

  this._driver = {}
  this._args = []
  this._timeout = 15000
  this._format = "GeoJSON"
  this._targetSrs = "EPSG:4326"
  this._sourceSrs = "EPSG:4326"

  this._testClean = function (){} // testing
}

Ogr2ogr.prototype.format = function (fmt) {
  var driver = util.getDriver(fmt)
  this._driver = driver
  this._format = driver.format || fmt || "GeoJSON"
  return this
}

Ogr2ogr.prototype.destination = function(str) {
  this._destination = str;
  return this
};

Ogr2ogr.prototype.timeout = function (ms) {
  this._timeout = ms
  return this
}

Ogr2ogr.prototype.project = function (dest, src) {
  this._targetSrs = dest
  if (src) this._sourceSrs = src
  return this
}

Ogr2ogr.prototype.exec = function (cb) {
  var ogr2ogr = this
  var buf = []
  var one = util.oneCallback(cb)

  this.stream()
    .on('data', function (chunk) { buf.push(chunk) })
    .on('error', one)
    .on('end', function () {
      var data = Buffer.concat(buf)
      if (ogr2ogr._format == 'GeoJSON') {
        try { data = JSON.parse(data) }
        catch (er) { return one(er) }
      }
      one(null, data)
   })
}

Ogr2ogr.prototype.stream = function () {
  return this._run()
}

Ogr2ogr.prototype._getOrgInPath = function (cb) {
  var ogr2ogr = this
  var one = util.oneCallback(cb)

  if (this._inStream) {
    util.writeStream(this._inStream, this._inDriver.output, getInFilePath)
  }
  else if (this._inGeoJSON) {
    util.writeGeoJSON(this._inGeoJSON, getInFilePath)
  }
  else {
    getInFilePath(null, this._inPath)
  }

  function getInFilePath (er, fpath) {
    if (er) return one(er)

    ogr2ogr._inPath = fpath

    ogr2ogr._isZipIn = /zip|kmz/.test(path.extname(fpath))
    ogr2ogr._isCsvIn = /csv/.test(path.extname(fpath))
    ogr2ogr._isZipOut = ogr2ogr._driver.output == 'zip'

    ogr2ogr._ogrOutPath = ogr2ogr._isZipOut ? util.genTmpPath() : '/vsistdout/'

    if (ogr2ogr._isZipIn) {
      zip.extract(fpath, function (er, fpath) {
        if (er) return one(er)
        zip.findOgrFile(fpath, one)
      })
    }
    else if (ogr2ogr._isCsvIn) {
      csv.makeVrt(fpath, one)
    }
    else {
      one(null, fpath)
    }
  }
}

Ogr2ogr.prototype._run = function () {
  var ogr2ogr = this
  var ostream = new stream.PassThrough()

  this._getOrgInPath(function (er, ogrInPath) {
    ogr2ogr._ogrInPath = ogrInPath

    var s = cp.spawn('ogr2ogr', logCommand([
      '-f', ogr2ogr._format, '-skipfailures',
      '-s_srs', ogr2ogr._sourceSrs,
      '-t_srs', ogr2ogr._targetSrs,
      '-a_srs', ogr2ogr._targetSrs,
      ogr2ogr._destination || ogr2ogr._ogrOutPath, ogrInPath
    ]))

    if (!ogr2ogr._isZipOut) s.stdout.pipe(ostream)

    var one = util.oneCallback(wrapUp)

    s.stderr.setEncoding('ascii')
    s.stderr.on('data', function (chunk) {
      if (chunk.match(/(error|failure)/i)) ostream.emit('error', new Error(chunk))
    })
    s.on('error', one)
    s.on('close', function (code) {
      clearTimeout(killTimeout)
      one(code ? new Error("Process exited with error " + code) : null)
    })

    var killTimeout = setTimeout(function () {
      if (s._handle) {
        ostream.emit('error', new Error('ogr2ogr took longer than '+ogr2ogr._timeout+' to complete'))
        s.stdout.destroy()
        s.stderr.destroy()
        s.kill('SIGKILL')
      }
    }, ogr2ogr._timeout)
  })

  function wrapUp (er) {
    if (er) ostream.emit('error', er)
    if (!ogr2ogr._isZipOut) return ogr2ogr._clean()

    var zs = zip.createZipStream(ogr2ogr._ogrOutPath)
    zs.on('error', function (er) { ostream.emit('error', er) })
    zs.on('end', function () { ogr2ogr._clean() })
    zs.pipe(ostream)
  }

  return ostream
}

Ogr2ogr.prototype._clean = function () {
  var all = util.allCallback(this._testClean)

  if (this._inStream && this._driver.output == 'zip') {
    util.rmDir(this._inPath, all())
  }
  else if (this._inStream || this._inGeoJSON) {
    util.rmFile(this._inPath, all())
  }

  if (this._isZipIn) {
    util.rmParentDir(this._ogrInPath, all())
  }
  if (this._isCsvIn && /vrt/.test(this._ogrInPath)) {
    util.rmFile(this._ogrInPath, all())
  }
  if (this._isZipOut) {
    util.rmDir(this._ogrOutPath, all())
  }
}
