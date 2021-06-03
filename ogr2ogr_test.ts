import test from 'blue-tape'
import ogr2ogr from './ogr2ogr'
import {Buffer} from 'buffer'
import type {GeoJSON} from 'geojson'
// import {execSync} from 'child_process'

let dir = __dirname + '/testdata/'

// console.log(execSync('ogrinfo --formats').toString())

test('Input path', async (t) => {
  interface TT {
    file: string
    out?: string
    success: boolean
  }
  let table: TT[] = [
    {file: 'sample.bad', success: false},
    {file: 'sample.shp.zip', success: true},
    {file: 'sample.geojson', success: true},
    {file: 'sample.gml', success: true},
    {file: 'sample.dbf', success: true},
    {file: 'sample.dgn', success: true},
    {file: 'sample.dxf', success: true},
    {file: 'sample.gdb', out: 'dxf', success: true},
    // {file: 'sample.bna', success: true},
  ]

  for (let tt of table) {
    let [out, err] = await ogr2ogr(dir + tt.file, {format: tt.out})
    if (tt.success) {
      if (!tt.out) {
        t.equal((out as GeoJSON).type, 'FeatureCollection')
      } else {
        t.ok(Buffer.isBuffer(out))
      }
      t.equal(err, '')
    } else {
      t.notEqual(err, '')
    }
  }
})
