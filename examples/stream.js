var ogr2ogr = require('../')

var st = ogr2ogr('../test/samples/sample.shp.zip').stream()
st.on('error', console.error)
st.pipe(process.stdout)
