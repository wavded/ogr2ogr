import test from 'blue-tape'
import ogr2ogr from './ogr2ogr'
import {Buffer} from 'buffer'
// import {execSync} from 'child_process'

let dir = __dirname + '/testdata/'

// console.log(execSync('ogrinfo --formats').toString())

test('Input path', async (t) => {
  interface TT {
    file?: string
    url?: string
    out?: string
    success: boolean
  }
  let table: TT[] = [
    {
      url: 'https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.geojson',
      success: true,
    },
    {
      url: 'https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.georss',
      success: true,
    },

    {file: 'sample.bad', success: false},
    {file: 'sample.dbf', success: true},
    {file: 'sample.dgn', success: true},
    {file: 'sample.dxf', success: true},
    // {file: 'sample.gdb.zip', out: 'dxf', success: true},
    {file: 'sample.geojson', success: true},
    {file: 'sample.gml', success: true},
    // {file: 'sample.gml.zip', success: true},
    {file: 'sample.gmt', success: true},
    {file: 'sample.gxt', success: true},
    {file: 'sample.itf', success: true},
    // {file: 'sample.itf.zip', success: true},
    {file: 'sample.json', success: true},
    {file: 'sample.kml', success: true},
    // {file: 'sample.kmz', success: true},
    // {file: 'sample.lonely.shp', success: true},
    {file: 'sample.map.zip', success: true},
    {file: 'sample.rss', success: true}, // {file: 'sample.rti.zip', success: true},
    {file: 'sample.shp', success: true},
    {file: 'sample.shp.zip', success: true},
    // {file: 'sample.vrt.zip', success: true},
    {file: 'simple.shp.zip', success: true},
  ]

  for (let tt of table) {
    try {
      let path = tt.url ? tt.url : dir + tt.file
      let [data] = await ogr2ogr(path, {format: tt.out})
      if (!tt.out) {
        t.equal(data.type, 'FeatureCollection')
      } else {
        t.ok(Buffer.isBuffer(data))
      }
      t.ok(tt.success)
      // console.log(stderr)
    } catch (err) {
      t.notOk(tt.success)
      // console.log(err)
    }
  }
})
