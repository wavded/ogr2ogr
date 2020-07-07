const path = require('path')
const ogr2ogr = require('../')
const fs = require('fs')

// Use options ["--config", "SHAPE_RESTORE_SHX", "TRUE"] to recreate the shx file if it doesn't exist
ogr2ogr(path.resolve(__dirname + '/../test/samples/sample.lonely.shp'))
  .options(['--config', 'SHAPE_RESTORE_SHX', 'TRUE'])
  .exec(function (er, data) {
    if (er) console.error(er)
    console.log(data)

    fs.unlinkSync(
      path.resolve(__dirname + '/../test/samples/sample.lonely.shx')
    )
  })
