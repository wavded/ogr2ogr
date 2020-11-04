const path = require('path')
const cp = require('child_process')
const zip = require('./modules/zip')
const csv = require('./modules/csv')
const util = require('./modules/util')
const stream = require('stream')
const EE = require('events').EventEmitter

function logCommand(args) {
  // console.error.apply(null, ['ogr2ogr'].concat(args))
  return args
}

module.exports = Ogr2ogr

function Ogr2ogr(mixed, fmt) {
  if (!(this instanceof Ogr2ogr)) return new Ogr2ogr(mixed, fmt)

  if (!mixed) {
    throw new Error('A file path, stream, or GeoJSON object is required')
  }

  if (mixed instanceof stream) {
    let driver = util.getDriver(
      fmt || path.extname(mixed.path).replace('.', '')
    )
    if (!driver) throw new Error('Streams require a valid input format')
    this._inStream = mixed
    this._inDriver = driver
  } else if (typeof mixed == 'object') {
    this._inGeoJSON = mixed
  } else {
    this._inPath = mixed
  }

  this._onStderr = function () {}
  this._driver = {}
  this._args = []
  this._timeout = 15000
  this._format = 'GeoJSON'
  this._skipfailures = false

  this._testClean = function () {} // testing
}

Ogr2ogr.prototype = Object.create(EE.prototype)

Ogr2ogr.prototype.format = function (fmt) {
  let driver = util.getDriver(fmt)
  this._driver = driver
  this._format = driver.format || fmt || 'GeoJSON'
  return this
}

Ogr2ogr.prototype.options = function (arr) {
  this._options = arr
  return this
}

Ogr2ogr.prototype.env = function (obj) {
  this._env = obj
  return this
}

Ogr2ogr.prototype.destination = function (str) {
  this._destination = str
  return this
}

Ogr2ogr.prototype.skipfailures = function () {
  this._skipfailures = true
  return this
}

Ogr2ogr.prototype.timeout = function (ms) {
  this._timeout = ms
  return this
}

Ogr2ogr.prototype.project = function (dest, src) {
  this._targetSrs = dest
  if (src) this._sourceSrs = src
  return this
}

Ogr2ogr.prototype.onStderr = function (fn) {
  this._onStderr = fn
  return this
}

Ogr2ogr.prototype.command = function (str) {
  this._command = str
  return this
}

Ogr2ogr.prototype.exec = function (cb) {
  let ogr2ogr = this
  let buf = []
  let one = util.oneCallback(cb)

  this.stream()
    .on('data', function (chunk) {
      buf.push(chunk)
    })
    .on('error', one)
    .on('close', function () {
      let data = Buffer.concat(buf)
      if (ogr2ogr._format == 'GeoJSON') {
        try {
          data = JSON.parse(data)
        } catch (er) {
          return one(er)
        }
      }
      one(null, data)
    })
}

Ogr2ogr.prototype.stream = function () {
  return this._run()
}

Ogr2ogr.prototype.promise = function () {
  let ogr2ogr = this
  let buf = []

  return new Promise((resolve, reject) => {
    this.stream()
      .on('data', function (chunk) {
        buf.push(chunk)
      })
      .on('error', (er) => reject(er))
      .on('close', function () {
        let data = Buffer.concat(buf)
        if (ogr2ogr._format == 'GeoJSON') {
          try {
            data = JSON.parse(data)
          } catch (er) {
            reject(er)
          }
        }
        resolve(data)
      })
  })
}

Ogr2ogr.prototype._getOrgInPath = function (cb) {
  let ogr2ogr = this
  let one = util.oneCallback(cb)

  if (this._inStream) {
    util.writeStream(this._inStream, this._inDriver.output, getInFilePath)
  } else if (this._inGeoJSON) {
    util.writeGeoJSON(this._inGeoJSON, getInFilePath)
  } else {
    getInFilePath(null, this._inPath)
  }

  function getInFilePath(er, fpath) {
    if (er) return one(er)

    ogr2ogr._inPath = fpath

    ogr2ogr._isZipIn =
      /zip|kmz/.test(path.extname(fpath)) &&
      !/^\/vsizip\//.test(fpath) &&
      !/\.gdb\.zip$/i.test(fpath)
    ogr2ogr._isCsvIn = /csv/.test(path.extname(fpath))
    ogr2ogr._isZipOut = ogr2ogr._driver.output == 'zip'

    ogr2ogr._ogrOutPath = ogr2ogr._isZipOut ? util.genTmpPath() : '/vsistdout/'

    if (ogr2ogr._isZipIn) {
      zip.extract(fpath, function (er2, fpath2) {
        if (er2) return one(er2)
        zip.findOgrFile(fpath2, one)
      })
    } else if (ogr2ogr._isCsvIn) {
      csv.makeVrt(fpath, function (err, vrt) {
        if (vrt && /\.vrt$/.test(vrt)) {
          // always set a source srs
          if (!ogr2ogr._sourceSrs) ogr2ogr._sourceSrs = ogr2ogr._targetSrs
        } else {
          // no geo data so no target srs
          delete ogr2ogr._targetSrs
        }
        one(err, vrt)
      })
    } else {
      one(null, fpath)
    }
  }
}

Ogr2ogr.prototype._run = function () {
  let ogr2ogr = this
  let ostream = new stream.PassThrough()

  this._getOrgInPath(function (er, ogrInPath) {
    if (er) return wrapUp(er)

    ogr2ogr._ogrInPath = ogrInPath
    let args = ['-f', ogr2ogr._format]
    if (ogr2ogr._skipfailures) args.push('-skipfailures')
    if (ogr2ogr._sourceSrs) args.push('-s_srs', ogr2ogr._sourceSrs)
    if (ogr2ogr._targetSrs) {
      args.push('-t_srs', ogr2ogr._targetSrs)
      args.push('-a_srs', ogr2ogr._targetSrs)
    }
    args.push(ogr2ogr._destination || ogr2ogr._ogrOutPath, ogrInPath)
    if (ogr2ogr._options) args = args.concat(ogr2ogr._options)

    let errbuf = ''

    let command = ogr2ogr._command || 'ogr2ogr'
    let commandOptions = this._env ? {env: this._env} : undefined
    let s = cp.spawn(command, logCommand(args), commandOptions)

    if (!ogr2ogr._isZipOut) s.stdout.pipe(ostream, {end: false})

    let one = util.oneCallback(wrapUp)
    let killTimeout

    s.stderr.setEncoding('ascii')
    s.stderr.on('data', function (chunk) {
      ogr2ogr._onStderr(chunk)
      if (/Error/i.test(chunk)) {
        s.emit('error', chunk)
      } else {
        errbuf += chunk
      }
    })
    s.on('error', function (err) {
      if (errbuf) errbuf += '\n' + err
      else errbuf = err
    })
    s.on('close', function (code) {
      clearTimeout(killTimeout)
      one(
        code ? new Error(errbuf || 'ogr2ogr failed to do the conversion') : null
      )
    })

    killTimeout = setTimeout(function () {
      if (s._handle) {
        ostream.emit(
          'error',
          new Error(
            'ogr2ogr took longer than ' + ogr2ogr._timeout + ' to complete'
          )
        )
        s.stdout.destroy()
        s.stderr.destroy()
        s.kill('SIGKILL')
      }
    }, ogr2ogr._timeout)
  })

  function wrapUp(er) {
    if (er) {
      ostream.emit('error', er)
      ostream.emit('close')
      return ogr2ogr._clean()
    }
    if (!ogr2ogr._isZipOut) {
      ostream.emit('end')
      ostream.emit('close')
      return ogr2ogr._clean()
    }

    let zs = zip.createZipStream(ogr2ogr._ogrOutPath)
    zs.on('error', function (er2) {
      ostream.emit('error', er2)
      ostream.emit('close')
    })
    zs.on('end', function () {
      ostream.emit('close')
      ogr2ogr._clean()
    })
    zs.pipe(ostream)
  }

  return ostream
}

Ogr2ogr.prototype._clean = function () {
  let all = util.allCallback(this._testClean)

  if (this._inStream && this._driver.output == 'zip') {
    util.rmDir(this._inPath, all())
  } else if (this._inStream || this._inGeoJSON) {
    util.rmFile(this._inPath, all())
  }

  if (this._isZipIn && this._ogrInPath) {
    util.rmParentDir(this._ogrInPath, all())
  }
  if (this._isCsvIn && /vrt/.test(this._ogrInPath)) {
    util.rmFile(this._ogrInPath, all())
  }
  if (this._isZipOut) {
    util.rmDir(this._ogrOutPath, all())
  }
}
