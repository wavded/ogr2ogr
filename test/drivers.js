"use strict"
var test = require('tap').test
var fs = require('fs')
var ogr2ogr = require('../')
var dir = __dirname+'/samples/'
var sampleGeoJSONUrl = "https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.geojson"
var sampleGeoRSSUrl = "https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.georss"

test('BNA', function (t) {
  t.plan(3)

  ogr2ogr(dir+'sample.bna').format('BNA').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })
})

test('CSV', function (t) {
  t.plan(9)

  ogr2ogr(dir+'sample-nogeom.csv').format('GeoJSON').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.equal(data && data.features[0].geometry, null, 'no spatial data')
  })

  ogr2ogr(dir+'sample.csv').format('GeoJSON').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(dir+'sample-geom.csv').format('GeoJSON').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(dir+'sample.csv').format('CSV').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })
})

test('DGN', function (t) {
  t.plan(2)
  ogr2ogr(dir+'sample.dgn').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: DGN Output
  // ogr2ogr(dir+'sample.dgn').format('DGN').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('DXF', function (t) {
  t.plan(2)
  ogr2ogr(dir+'sample.dgn').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: DXF Output
  // ogr2ogr(dir+'sample.dxf').format('DXF').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('ESRI Shapefile', function (t) {
  t.plan(4)

  ogr2ogr(dir+'sample.shp.zip').format('ESRI Shapefile').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.equal(buf[0], 80, 'in zip format')
      t.ok(buf.length > 40, 'is not empty zip')
    }
  })
})

test('Geoconcept', function (t) {
  t.plan(2)
  ogr2ogr(dir+'sample.gxt').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Geoconcept Output
  // ogr2ogr(dir+'sample.dxf').format('Geoconcept').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('GeoJSON', function (t) {
  t.plan(4)

  ogr2ogr(dir+'sample.geojson').format('GeoJSON').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.equal(data && data.type, 'FeatureCollection', 'is GeoJSON data')
  })

  ogr2ogr(sampleGeoJSONUrl).format('GeoJSON').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.equal(data && data.type, 'FeatureCollection', 'is GeoJSON data')
  })
})

test('GeoRSS', function (t) {
  t.plan(7)
  ogr2ogr(dir+'sample.rss').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(sampleGeoRSSUrl).exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(dir+'sample.rss').format('GeoRSS').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })
})

test('GML', function (t) {
  t.plan(5)
  ogr2ogr(dir+'sample.gml').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Add GML Url

  ogr2ogr(dir+'sample.gml').format('GML').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })
})

test('GMT', function (t) {
  t.plan(2)
  ogr2ogr(dir+'sample.gmt').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Add GMT Output
  // ogr2ogr(dir+'sample.gmt').format('GMT').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('GPX', function (t) {
  t.plan(4)

  ogr2ogr(dir+'sample.gpx').format('ESRI Shapefile').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.equal(buf[0], 80, 'in zip format')
      t.ok(buf.length > 40, 'is not empty zip')
    }
  })

  // TODO: Add GPX Output
  // ogr2ogr(dir+'sample.gpx').format('GPX').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('KML', function (t) {
  t.plan(6)

  ogr2ogr(dir+'sample.kml').format('KML').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })

  ogr2ogr(dir+'sample.kmz').format('KML').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.notEqual(buf[0], 80, 'not in zip format')
    }
  })
})

test('MapInfo File', function (t) {
  t.plan(4)

  ogr2ogr(dir+'sample.map.zip').format('MapInfo File').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.equal(buf[0], 80, 'in zip format')
      t.ok(buf.length > 40, 'is not empty zip')
    }
  })
})

test('TIGER', function (t) {
  t.plan(4)

  ogr2ogr(dir+'sample.rti.zip').format('TIGER').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })

    if (buf) {
      t.ok(Buffer.isBuffer(buf), 'is buffer')
      t.equal(buf[0], 80, 'in zip format')
      t.ok(buf.length > 40, 'is not empty zip')
    }
  })
})

test('PGDump', function (t) {
  ogr2ogr(dir+'sample.geojson').format('PGDump').exec(function (er, buf) {
    t.notOk(er, 'no error', { error: er })
    var sql = buf.toString()
    t.ok(/CREATE TABLE/.test(sql), 'is sql')
    t.end()
  })
})

test('PostgreSQL', function (t) {
  ogr2ogr(dir+'sample.geojson')
    .format('PostgreSQL')
    .destination('PG:host=localhost user=postgres dbname=sandbox password=postgres')
    .exec(function (er, buf) {
      t.ok(/Connection refused/.test(er.message), 'should try to connect to postgres')
      t.end()
    })
})

test('VRT', function (t) {
  t.plan(2)
  ogr2ogr(dir+'sample.vrt.zip').exec(function (er, data) {
    t.notOk(er, 'no error', { error: er })
    t.ok(data && data.features[0].geometry, 'spatial data')
  })
})
