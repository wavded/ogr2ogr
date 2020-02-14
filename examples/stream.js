const ogr2ogr = require('../')

let st = ogr2ogr('../test/samples/sample.shp.zip').stream()
st.on('error', console.error)
st.pipe(process.stdout)
