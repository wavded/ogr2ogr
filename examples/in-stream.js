var ogr2ogr = require('../')
var fs = require('fs')

var rs = fs.createReadStream('../test/samples/sample.shp.zip')

ogr2ogr(rs, 'ESRI Shapefile').exec(function (er, data) {
  // geojson data
})
