"use strict"
var test = require('tap').test
var ogr2ogr = require('../')
var sampleKml = __dirname+'/samples/sample.kml'
var formats = require('../lib/formats.json')

test('convert to ESRI Shapefile', function (t) {
  t.plan(3)

  ogr2ogr(sampleKml, { format: 'ESRI Shapefile' }).exec(function (er, data) {
    t.notOk(er, 'should not return an error', { error: er })
    t.ok(!!data, 'should have data')
    t.equal(data[0], 80, 'should be zip format')
  })
})

test('convert to MapInfo File', function (t) {
  t.plan(3)

  ogr2ogr(sampleKml, { format: 'MapInfo File' }).exec(function (er, data) {
    t.notOk(er, 'should not return an error', { error: er })
    t.ok(!!data, 'should have data')
    t.equal(data[0], 80, 'should be zip format')
  })
})

test('convert to TIGER', function (t) {
  t.plan(3)

  ogr2ogr(sampleKml, { format: 'TIGER' }).exec(function (er, data) {
    t.notOk(er, 'should not return an error', { error: er })
    t.ok(!!data, 'should have data')
    t.equal(data[0], 80, 'should be zip format')
  })
})
