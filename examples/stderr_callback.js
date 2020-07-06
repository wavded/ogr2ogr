const path = require('path')
const ogr2ogr = require('../')

// Set option ["--config", "CPL_DEBUG", "ON"] to enable ogr2ogr debug output, then hook a callback to `onStderr` method
let st = ogr2ogr(path.resolve(__dirname + '/../test/samples/simple.shp.zip'))
  .options(['--config', 'CPL_DEBUG', 'ON'])
  .onStderr(function (data) {
    console.log(data)
  })
  .stream()

st.on('error', console.error)
st.pipe(process.stdout)
