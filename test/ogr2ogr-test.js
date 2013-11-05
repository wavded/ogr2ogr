"use strict"
var assert = require('assert')
var ogr2ogr = require('../')

function getData (ostream, cb) {
  var data = '', er

  ostream
    .on('readable', function () {
      data += ostream.read()
    })
    .on('ogrerror', function (e) { er = e })
    .on('error', cb)
    .on('end', function () { cb(er, data) })
}

function testToGeoJSON (path, ignoreStreamEr) {
  return function (done) {
    var s = ogr2ogr(path)
    getData(s, function (er, json) {
      if (er && !ignoreStreamEr) return done(er)
      try {
        var data = JSON.parse(json)
        assert.equal(data.type, 'FeatureCollection')
        assert.ok(Array.isArray(data.features))
        done()
      } catch (er) { done(er) }
    })
  }
}

describe('ogr2ogr ete', function (next) {
  it('fails when no path is provided', function () {
    assert.throws(ogr2ogr, /required/)
  })
  it('fails on unsupported format', function (done) {
    testToGeoJSON(__dirname+'/samples/sample.bad')(function (er) {
      assert.ok(er)
      done()
    })
  })

  it('converts bna', testToGeoJSON(__dirname+'/samples/sample.bna'))
  it('converts csv', testToGeoJSON(__dirname+'/samples/sample.csv'))
  it('converts csv w/ geom', testToGeoJSON(__dirname+'/samples/sample-geom.csv'))
  it('converts csv w/ no geom', testToGeoJSON(__dirname+'/samples/sample-nogeom.csv'))
  it('converts dgn', testToGeoJSON(__dirname+'/samples/sample.dgn'))
  it('converts dxf', testToGeoJSON(__dirname+'/samples/sample.dxf'))
  it('converts geojson', testToGeoJSON(__dirname+'/samples/sample.geojson'))
  it('converts gml', testToGeoJSON(__dirname+'/samples/sample.gml'))
  it('converts gml zipped', testToGeoJSON(__dirname+'/samples/sample.gml.zip'))
  it('converts gmt', testToGeoJSON(__dirname+'/samples/sample.gmt'))
  it('converts gpx', testToGeoJSON(__dirname+'/samples/sample.gpx', true))
  it('converts gtm', testToGeoJSON(__dirname+'/samples/sample.gtm', true))
  it('converts gxt', testToGeoJSON(__dirname+'/samples/sample.gxt'))
  it('converts itf', testToGeoJSON(__dirname+'/samples/sample.itf'))
  it('converts itf zipped', testToGeoJSON(__dirname+'/samples/sample.itf.zip'))
  it('converts json', testToGeoJSON(__dirname+'/samples/sample.json'))
  it('converts kml', testToGeoJSON(__dirname+'/samples/sample.kml'))
  it('converts kmz', testToGeoJSON(__dirname+'/samples/sample.kmz'))
  it('converts map zipped', testToGeoJSON(__dirname+'/samples/sample.map.zip'))
  it('converts rss', testToGeoJSON(__dirname+'/samples/sample.rss'))
  it('converts rti zipped', testToGeoJSON(__dirname+'/samples/sample.rti.zip', true))
  it('converts s57 zipped', testToGeoJSON(__dirname+'/samples/sample.s57.zip', true))
  it('converts shp zipped', testToGeoJSON(__dirname+'/samples/sample.shp.zip'))
  it('converts vrt zipped', testToGeoJSON(__dirname+'/samples/sample.vrt.zip'))

  it('does not convert single shp', function (done) {
    testToGeoJSON(__dirname+'/samples/sample.shp')(function (er) {
      assert.ok(er)
      done()
    })
  })
})
