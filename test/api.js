"use strict"
var test = require('tap').test
var fs = require('fs')
var ogr2ogr = require('../')
var sampleKml = __dirname+'/samples/sample.kml'
var sampleCsv = __dirname+'/samples/sample.csv'
var sampleCsvNogeom = __dirname+'/samples/sample-nogeom.csv'
var sampleJson = __dirname+'/samples/sample.json'
var sampleNestedZip = __dirname+'/samples/sample.shp.nested.zip'

var bufferStream = function (st, cb) {
  var data = []
  st.on('data', function (buf) { data.push(buf) })
  st.on('end', function () {
    data = Buffer.isBuffer(data[0]) ? Buffer.concat(data) : data.join('')
    cb(data)
  })
}

test('fails when no path, stream, or GeoJSON object', function (t) {
  t.plan(1)
  t.throws(ogr2ogr, 'boom!')
})

test('fails on unsupported input format', function (t) {
  t.plan(2)
  ogr2ogr(__dirname+'/samples/sample.bad').exec(function (er, data) {
    t.ok(er, 'expect error', { error: er })
    t.notOk(data, 'no data')
  })
})

test('api input formats', function (t) {
  test('accepts a path', function (t) {
    t.plan(5)

    var ogr = ogr2ogr(sampleKml)
    ogr.exec(function (er, data) {
      t.notOk(er, 'no error', { error: er })
      t.equal(data && data.type, 'FeatureCollection', 'is geojson')
    })

    ogr._testClean = function (er, cleaned) {
      t.notOk(er, 'no error', { error: er })
      t.equal(cleaned, 0, 'nothing to clean up')
      t.ok(fs.existsSync(ogr._inPath), 'keeps input file')
    }
  })

  test('accepts a GeoJSON object', function (t) {
    t.plan(12)

    var geojson = {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [ 102.0, 0.5 ]
        },
        "properties": {
          "area": "51"
        }
      }]
    }

    var ogr = ogr2ogr(geojson).project("EPSG:3857")

    ogr.exec(function (er, data) {
      t.notOk(er, 'no error', { error: er })
      t.equal(data.type, 'FeatureCollection', 'is geojson')
      t.equal(data.features[0].properties.area, '51', 'maintains attributes')
      t.equal(data.features[0].geometry.coordinates[0], 11354588.060913906, 'is reprojected')
    })

    ogr._testClean = function (er, cleaned) {
      t.notOk(er, 'no error', { error: er })
      t.equal(cleaned, 1, 'one to clean up')
      t.notOk(fs.existsSync(ogr._inPath), 'tmp file cleaned')
    }

    var ogr2 = ogr2ogr(geojson).format('shp')
    var st = ogr2.stream()

    bufferStream(st, function (buf) {
      t.equal(buf[0], 80, 'should be zip format')
    })

    ogr2._testClean = function (er, cleaned) {
      t.notOk(er, 'no error', { error: er })
      t.equal(cleaned, 2, 'two to clean up')
      t.notOk(fs.existsSync(ogr2._inPath), 'tmp file cleaned')
      t.notOk(fs.existsSync(ogr2._ogrOutPath), 'tmp shp dir cleaned')
    }
  })

  test('accepts a stream', function (t) {
    t.plan(10)

    var stream = fs.createReadStream(sampleKml)
    var ogr = ogr2ogr(stream, 'kml')

    ogr.exec(function (er, data) {
      t.notOk(er, 'no error', { error: er })
      t.equal(data.type, 'FeatureCollection', 'is geojson')
    })

    ogr._testClean = function (er, cleaned) {
      t.notOk(er, 'no error', { error: er })
      t.equal(cleaned, 1, 'one to clean up')
      t.notOk(fs.existsSync(ogr._inPath), 'tmp file cleaned')
    }

    // can infer type depending on stream source
    var stream2 = fs.createReadStream(sampleKml)
    var ogr2 = ogr2ogr(stream)

    ogr2.exec(function (er, data) {
      t.notOk(er, 'no error', { error: er })
      t.equal(data.type, 'FeatureCollection', 'is geojson')
    })

    ogr2._testClean = function (er, cleaned) {
      t.notOk(er, 'no error', { error: er })
      t.equal(cleaned, 1, 'one to clean up')
      t.notOk(fs.existsSync(ogr._inPath), 'tmp file cleaned')
    }
  })
  t.end()
})

test('api output formats', function (t) {
  test('returns a stream', function (t) {
    t.plan(3)

    var st = ogr2ogr(sampleKml).stream()
    bufferStream(st, function (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      var data = JSON.parse(buf)
      t.equal(data && data.type, 'FeatureCollection', 'is geojson')
    })

    var st = ogr2ogr(__dirname+'/samples/sample.bad').stream()
    st.resume()
    st.on('error', function (er) {
      t.ok(er, 'streams emit errors', { error: er })
    })
  })

  test('takes a callback', function (t) {
    t.plan(2)

    ogr2ogr(sampleKml).exec(function (er, data) {
      t.notOk(er, 'no error', { error: er })
      t.equal(data && data.type, 'FeatureCollection', 'is geojson')
    })
  })
  t.end()
})

test('generates a vrt for csv files', function (t) {
  t.plan(5)

  var ogr = ogr2ogr(sampleCsv)

  ogr.exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.equal(data.type, 'FeatureCollection', 'is geojson')
  })

  ogr._testClean = function (er, cleaned) {
    t.notOk(er, 'no error', { error: er })
    t.equal(cleaned, 1, 'one to clean up')
    t.notOk(fs.existsSync(ogr._ogrInPath), 'tmp vrt file cleaned')
  }
})

test('errors when converting', function (t) {
  t.plan(2)
  ogr2ogr(sampleJson).format('shp').exec(function (er, buf) {
    t.ok(er, 'expect error', { error: er })
  })

  var st = ogr2ogr(sampleJson).format('shp').stream()
  st.on('error', function (er) {
    t.ok(er, 'expect error', { error: er })
  })
})

test('always get the error when ogr2ogr returns with error code', function(t) {
  ogr2ogr(sampleCsvNogeom)
  .format("PGDump")
  .project("EPSG:232ASFD121") // bogus EPSG
  .exec(function(er, data) {
    t.ok(er, 'expect error', { error: er })
    t.end()
  })
})

test('traverses zips', function (t) {
  t.plan(2)
  ogr2ogr(sampleNestedZip).exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.equal(data && data.type, 'FeatureCollection', 'is geojson')
  })
})

test('kills ogr2ogr when timeout breached', function (t) {
  t.plan(2)
  ogr2ogr(sampleNestedZip).timeout(50).exec(function (er, data) {
    t.ok(er, 'expect error', { error: er })
    t.notOk(data, 'no data')
  })
})

test('skipfailures option', function (t) {
  var ogr = ogr2ogr(sampleNestedZip).skipfailures()
  t.equal(ogr._skipfailures, true, 'sets skip failures to true')
  t.end()
})
