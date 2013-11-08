"use strict"
var path = require('path')
var cp = require('child_process')
var when = require('when')
var nodefn = require('when/node/function')
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

  if (!mixed) {
    throw new Error('A file path, stream, or GeoJSON object is required')
  }

  if (mixed instanceof stream) {
    var driver = util.getDriver(fmt)
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

Ogr2ogr.prototype.project = function (dest, src) {
  this._targetSrs = dest
  if (src) this._sourceSrs = src
  return this
}

Ogr2ogr.prototype.exec = function (cb) {
  var ogr2ogr = this
  var d = when.defer()
  var buf = []

  this._run()
    .on('data', function (chunk) { buf.push(chunk) })
    .on('error', d.reject)
    .on('end', function () {
      var data = Buffer.concat(buf)
      // console.error(data)
      if (ogr2ogr._format == 'GeoJSON') {
        try { data = JSON.parse(data) } catch (e) { d.reject(e) }
      }
      d.resolve(data)
   })

  if (cb) nodefn.bindCallback(d.promise, cb)
  return d.promise
}

Ogr2ogr.prototype.stream = function () {
  return this._run()
}

Ogr2ogr.prototype._getOrgInPath = function () {
  var ogr2ogr = this
  var getInFilePath = this._inStream  ? util.writeStream(this._inStream, this._inDriver.extension)
                    : this._inGeoJSON ? util.writeGeoJSON(this._inGeoJSON)
                    : when(this._inPath)

  return getInFilePath.then(function (fpath) {
    ogr2ogr._inPath = fpath

    ogr2ogr._isZipIn = /zip|kmz/.test(path.extname(fpath))
    ogr2ogr._isCsvIn = /csv/.test(path.extname(fpath))
    ogr2ogr._isZipOut = ogr2ogr._driver.useZipOutStream

    ogr2ogr._ogrOutPath = ogr2ogr._isZipOut ? util.genTmpPath() : '/vsistdout/'

    return ogr2ogr._isZipIn ? zip.extract(fpath).then(zip.findOgrFile)
         : ogr2ogr._isCsvIn ? csv.makeVrt(fpath)
         : when(fpath)
  })
}

Ogr2ogr.prototype._run = function () {
  var ogr2ogr = this
  var ostream = new stream.PassThrough()

  this._getOrgInPath()
    .then(function (ogrInPath) {
      ogr2ogr._ogrInPath = ogrInPath
      var d = when.defer()

      var s = cp.spawn('ogr2ogr', logCommand([
        '-f', ogr2ogr._format, '-skipfailures',
        '-s_srs', ogr2ogr._sourceSrs,
        '-t_srs', ogr2ogr._targetSrs,
        '-a_srs', ogr2ogr._targetSrs,
        ogr2ogr._ogrOutPath, ogrInPath
      ]))

      if (!ogr2ogr._isZipOut) s.stdout.pipe(ostream)

      s.stderr.setEncoding('ascii')
      s.stderr.on('data', function (chunk) {
        chunk.split('\n').forEach(function (msg) {
          if (msg.match(/ERROR|FAILURE/i)) d.reject(new Error(msg))
        })
      })
      s.on('error', d.reject)
      s.on('close', d.resolve)

      return d.promise
    })
    .then(function () {
      if (!ogr2ogr._isZipOut) return

      var sd = when.defer()
      var zs = zip.createZipStream(ogr2ogr._ogrOutPath)
      zs.pipe(ostream)
      zs.on('error', sd.reject)
      zs.on('end', sd.resolve)
      return sd
    })
    .otherwise(function (er) {
      // console.error(er.stack)
      ostream.emit('error', er)
    })
    .ensure(function () {
      ogr2ogr._clean()
    })

  return ostream
}

Ogr2ogr.prototype._clean = function () {
  var all = []

  if (this._inStream && this._driver.extension == 'zip') {
    all.push(util.rmDir(this._inPath))
  }
  else if (this._inStream || this._inGeoJSON) {
    all.push(util.rmFile(this._inPath))
  }

  if (this._isZipIn) {
    all.push(util.rmParentDir(this._ogrInPath))
  }
  if (this._isCsvIn && /vrt/.test(this._ogrInPath)) {
    all.push(util.rmFile(this._ogrInPath))
  }
  if (this._isZipOut) {
    all.push(util.rmDir(this._ogrOutPath))
  }

  nodefn.bindCallback(when.all(all), this._testClean)
}
