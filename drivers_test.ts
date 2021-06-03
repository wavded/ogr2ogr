import test from 'blue-tape'
import ogr2ogr from './ogr2ogr'
// import {Buffer} from 'buffer'
import type {GeoJSON} from 'geojson'
import {execSync} from 'child_process'

let dir = __dirname + '/testdata/'

console.log(execSync('ogrinfo --formats'))

// test('Empty ZIP', async (t) => {
//   let [stdout, stderr] = await ogr2ogr(dir + 'sample-empty.zip')
//   t.equal((stdout as GeoJSON).type, 'FeatureCollection')
//   t.equal(stderr, '')
// })

// test('ESRI Shapefile', async (t) => {
//   let [out, err] = await ogr2ogr(dir + 'sample.shp.zip')
//   t.equal((out as GeoJSON).type, 'FeatureCollection')
//   t.equal(err, '')
// })

test('GeoJSON', async (t) => {
  let [out, err] = await ogr2ogr(dir + 'sample.geojson')
  t.equal((out as GeoJSON).type, 'FeatureCollection')
  t.equal(err, '')
  ;[out, err] = await ogr2ogr(dir + 'sample.geojson', {
    inputFormat: 'CSV',
  })
  t.notEqual(err, '')
})

test('BNA', async (t) => {
  let [stdout, stderr] = await ogr2ogr(dir + 'sample.bna')
  t.equal((stdout as GeoJSON).type, 'FeatureCollection')
  t.equal(stderr, '')
})
