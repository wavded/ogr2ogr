const path = require('path')
const ogr2ogr = require(path.join(__dirname, '../'))
let tmpdir = require('os').tmpdir()
if (tmpdir === '/src') tmpdir = '/tmp' // docker issue

ogr2ogr(path.join(__dirname, '../test/samples/sample.shp.zip'))
  .command(
    `docker run -v ${tmpdir}:${tmpdir} --rm osgeo/gdal:alpine-small-latest ogr2ogr`
  )
  .exec(function (er, data) {
    if (er) {
      console.log('er', er)
    } else {
      console.log('data', data)
    }
  })
