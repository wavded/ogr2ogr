const test = require('tape')
const ogr2ogr = require('../')
const fs = require('fs')
const join = require('path').join

let dir = join(__dirname, '/samples/')

let sampleGeoJSONUrl =
  'https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.geojson'

let sampleGeoRSSUrl =
  'https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.georss'

test('Empty ZIP', function (t) {
  ogr2ogr(dir + 'sample-empty.zip').exec(function (er) {
    t.ok(er, 'error', {error: er})
    t.end()
  })
})

test('BNA', function (t) {
  t.plan(3)

  ogr2ogr(dir + 'sample.bna')
    .format('BNA')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })
})

test('CSV', function (t) {
  t.plan(9)

  ogr2ogr(dir + 'sample-nogeom.csv')
    .format('GeoJSON')
    .exec(function (er, data) {
      t.notOk(er, 'no error', {error: er})
      t.equal(data && data.features[0].geometry, null, 'no spatial data')
    })

  ogr2ogr(dir + 'sample.csv')
    .format('GeoJSON')
    .exec(function (er, data) {
      t.notOk(er, 'no error', {error: er})
      t.ok(data && data.features[0].geometry, 'spatial data')
    })

  ogr2ogr(dir + 'sample-geom.csv')
    .format('GeoJSON')
    .exec(function (er, data) {
      t.notOk(er, 'no error', {error: er})
      t.ok(data && data.features[0].geometry, 'spatial data')
    })

  ogr2ogr(dir + 'sample.csv')
    .format('CSV')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })
})

test('DGN', function (t) {
  t.plan(2)
  ogr2ogr(dir + 'sample.dgn').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: DGN Output
  // ogr2ogr(dir+'sample.dgn').format('DGN').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('DXF', function (t) {
  t.plan(2)
  ogr2ogr(dir + 'sample.dgn').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: DXF Output
  // ogr2ogr(dir+'sample.dxf').format('DXF').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('ESRI Shapefile', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.shp.zip')
    .format('ESRI Shapefile')
    .options(['--config', 'SHAPE_RESTORE_SHX', 'TRUE'])
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

test('uncompressed ESRI Shapefile', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.shp')
    .format('ESRI Shapefile')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

test('uncompressed ESRI Shapefile without shx', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.lonely.shp')
    .format('ESRI Shapefile')
    .options(['--config', 'SHAPE_RESTORE_SHX', 'TRUE'])
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})
      fs.unlinkSync(dir + 'sample.lonely.shx')
      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

//The default ESRI File Geodatabase driver, OpenFileGDB, provides only read access.
//Outputting to ESRI Shapefile instead.
test('ESRI Geodatabase', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.gdb')
    .format('ESRI Shapefile')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        //console.log("buf = " +  buf);
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

//The default ESRI File Geodatabase driver, OpenFileGDB, provides only read access.
//Outputting to ESRI Shapefile instead.
test('ESRI Geodatabase - zipped', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.gdb.zip')
    .format('ESRI Shapefile')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        //console.log("buf = " +  buf);
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

test('Geoconcept', function (t) {
  t.plan(2)
  ogr2ogr(dir + 'sample.gxt').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Geoconcept Output
  // ogr2ogr(dir+'sample.dxf').format('Geoconcept').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('GeoJSON', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.geojson')
    .format('GeoJSON')
    .exec(function (er, data) {
      t.notOk(er, 'no error', {error: er})
      t.equal(data && data.type, 'FeatureCollection', 'is GeoJSON data')
    })

  ogr2ogr(sampleGeoJSONUrl)
    .format('GeoJSON')
    .exec(function (er, data) {
      t.notOk(er, 'no error', {error: er})
      t.equal(data && data.type, 'FeatureCollection', 'is GeoJSON data')
    })
})

test('GeoRSS', function (t) {
  t.plan(7)
  ogr2ogr(dir + 'sample.rss').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(sampleGeoRSSUrl).exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  ogr2ogr(dir + 'sample.rss')
    .format('GeoRSS')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })
})

test('GML', function (t) {
  t.plan(5)
  ogr2ogr(dir + 'sample.gml').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Add GML Url

  ogr2ogr(dir + 'sample.gml')
    .format('GML')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })
})

test('GMT', function (t) {
  t.plan(2)
  ogr2ogr(dir + 'sample.gmt').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })

  // TODO: Add GMT Output
  // ogr2ogr(dir+'sample.gmt').format('GMT').exec(function (er, buf) {
  //   t.notOk(er, 'no error', { error: er })
  // })
})

test('GPX', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.gpx')
    .format('ESRI Shapefile')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

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

test('GPKG', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.gpkg')
    .skipfailures()
    .format('ESRI Shapefile')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })

  // TODO: Add GPKG Output
  // ogr2ogr(dir + 'sample.geojson').format('GPKG').exec(function(er, buf) {
  //   t.notOk(er, 'no error', {error: er})
  // })
})

test('KML', function (t) {
  t.plan(6)

  ogr2ogr(dir + 'sample.kml')
    .format('KML')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })

  ogr2ogr(dir + 'sample.kmz')
    .format('KML')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.notEqual(buf[0], 80, 'not in zip format')
      }
    })
})

test('MapInfo File', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.map.zip')
    .format('MapInfo File')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

test('TIGER', function (t) {
  t.plan(4)

  ogr2ogr(dir + 'sample.rti.zip')
    .format('TIGER')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})

      if (buf) {
        t.ok(Buffer.isBuffer(buf), 'is buffer')
        t.equal(buf[0], 80, 'in zip format')
        t.ok(buf.length > 40, 'is not empty zip')
      }
    })
})

test('PGDump', function (t) {
  ogr2ogr(dir + 'sample.geojson')
    .format('PGDump')
    .exec(function (er, buf) {
      t.notOk(er, 'no error', {error: er})
      let sql = buf.toString()
      t.ok(/CREATE TABLE/.test(sql), 'is sql')
      t.end()
    })
})

test('PostgreSQL', function (t) {
  ogr2ogr(dir + 'sample.geojson')
    .format('PostgreSQL')
    .destination(
      'PG:host=localhost user=postgres dbname=sandbox password=postgres'
    )
    .exec(function (er) {
      t.ok(
        /Connection refused/.test(er.message) ||
          /password authentication failed/.test(er.message),
        'should try to connect to postgres'
      )
      t.end()
    })
})

test('VRT', function (t) {
  t.plan(2)
  ogr2ogr(dir + 'sample.vrt.zip').exec(function (er, data) {
    t.notOk(er, 'no error', {error: er})
    t.ok(data && data.features[0].geometry, 'spatial data')
  })
})
