var ogr2ogr = require('../')

ogr2ogr('../test/samples/sample.shp.zip').exec(function (er, data) {
  if (er) console.error(er)
  console.log(data)
})
