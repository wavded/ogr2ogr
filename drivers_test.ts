import test from 'blue-tape'
import ogr2ogr from './ogr2ogr'
import {Buffer} from 'buffer'
import type {GeoJSON} from 'geojson'

let dir = __dirname + '/testdata/'

test('GeoJSON', async (t) => {
  let [data, stderr] = await ogr2ogr(dir + 'sample.geojson')
  t.equal((data as GeoJSON).type, 'FeatureCollection')
  t.equal(stderr, '')
  ;[data, stderr] = await ogr2ogr(dir + 'sample.geojson', {
    inputFormat: 'CSV',
  })
  t.notEqual(stderr, '')
})

test('BNA', async (t) => {
  let [data, stderr] = await ogr2ogr(dir + 'sample.bna')
  t.ok(Buffer.isBuffer(data), 'is buffer')
  t.notEqual((data as Buffer)[0], 80, 'not in zip format')
  t.equal(stderr, '')
})
