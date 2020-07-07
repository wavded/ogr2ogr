const ogr2ogr = require('../')
const fs = require('fs')

let rs = fs.createReadStream('../test/samples/sample.shp.zip')

ogr2ogr(rs, 'ESRI Shapefile').exec(function (er, data) {
  if (er) console.error(er)
  console.log(data) // geojson data
})
