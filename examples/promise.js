var ogr2ogr = require('../')

var promise = ogr2ogr('../test/samples/sample.shp.zip').exec()
promise.then(console.log, console.error)
