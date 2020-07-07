const fs = require('fs')
const path = require('path')
const CSV = require('comma-separated-values')
const util = require('./util')

let BASE_VRT = `<OGRVRTDataSource>
  <OGRVRTLayer name="{{name}}">
    <SrcDataSource>{{file}}</SrcDataSource>
    <GeometryType>wkbUnknown</GeometryType>
    <GeometryField encoding="{{enc}}" {{encopt}} />
  </OGRVRTLayer>
</OGRVRTDataSource>`

let extractHead = function (fpath, cb) {
  let sf = fs.createReadStream(fpath)
  let one = util.oneCallback(cb)
  let data = ''
  sf.on('data', function (chunk) {
    data += chunk
    if (data) {
      sf.pause()
      sf.destroy()
      sf.emit('end')
    }
  })
  sf.on('error', one)
  sf.on(
    'end',
    util.oneCallback(function () {
      CSV.forEach(data.split(/(?:\n|\r\n|\r)/g).shift(), function (head) {
        one(null, head)
      })
      // if there is nothing to parse
      one()
    })
  )
}

exports.makeVrt = function (fpath, cb) {
  extractHead(fpath, function (er, headers) {
    if (er) return cb(er)

    let geo = {}
    headers.forEach(function (header) {
      let ht = String(header).trim()
      switch (true) {
        case /\b(lon|longitude|lng|x)\b/i.test(ht):
          geo.x = header
          break
        case /\b(lat|latitude|y)\b/i.test(ht):
          geo.y = header
          break
        case /\b(the_geom|geom)\b/i.test(ht):
          geo.geom = header
          break
        default:
      }
    })

    // no geometry fields, parse attributes
    if (!geo.geom && !geo.x) return cb(null, fpath)

    let vrtData = util.tmpl(BASE_VRT, {
      file: fpath,
      name: path.basename(fpath, '.csv'),
      enc: geo.geom ? 'WKT' : 'PointFromColumns',
      encopt: geo.geom
        ? 'field="' + geo.geom + '"'
        : 'x="' + geo.x + '" y="' + geo.y + '"',
    })

    let vrtPath = util.genTmpPath() + '.vrt'
    return fs.writeFile(vrtPath, vrtData, function (er2) {
      cb(er2, vrtPath)
    })
  })
}
