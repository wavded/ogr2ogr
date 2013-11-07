"use strict"
var test = require('tap').test
var ogr2ogr = require('../')
var sampleKml = __dirname+'/samples/sample.kml'
var bufferStream = function (st, cb) {
  var data = []
  st.on('data', function (buf) { data.push(buf) })
  st.on('end', function () {
    data = Buffer.isBuffer(data[0]) ? Buffer.concat(data) : data.join('')
    cb(data)
  })
}

test('fails when no path', function (t) {
  t.plan(1)
  t.throws(ogr2ogr)
})

test('fails on unsupported format', function (t) {
  t.plan(2)
  ogr2ogr(__dirname+'/samples/sample.bad').exec(function (er, data) {
    t.ok(er)
    t.notOk(data)
  })
})

test('fails on unconvertable format', function (t) {
  t.plan(2)
  ogr2ogr(sampleKml, { format: 'Not Legit' }).exec(function (er, data) {
    t.ok(er)
    t.notOk(data)
  })
})

test('streams emit errors', function (t) {
  t.plan(1)
  var st = ogr2ogr(__dirname+'/samples/sample.bad').stream()
  st.resume()
  st.on('error', function (er) { t.ok(er) })
})

test('returns GeoJSON by default', function (t) {
  t.plan(5)

  // streams
  var st = ogr2ogr(sampleKml).stream()
  bufferStream(st, function (buf) {
    t.ok(Buffer.isBuffer(buf), 'should return a buffer')
    var data = JSON.parse(buf)
    t.equal(data.type, 'FeatureCollection')
  })

  // callbacks
  ogr2ogr(sampleKml).exec(function (er, data) {
    t.notOk(er)
    t.equal(data.type, 'FeatureCollection')
  })

  // promises
  ogr2ogr(sampleKml).exec()
    .then(function (data) {
      t.equal(data.type, 'FeatureCollection')
    })
})
