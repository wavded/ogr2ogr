"use strict"
var fs = require('fs')
var path = require('path')
var csv = require('csv')
var util = require('./util')

var BASE_VRT = '<OGRVRTDataSource>\n\
                  <OGRVRTLayer name="{{name}}">\n\
                    <SrcDataSource>{{file}}</SrcDataSource>\n\
                    <GeometryField encoding="{{enc}}" {{encopt}} />\n\
                  </OGRVRTLayer>\n\
                </OGRVRTDataSource>'

var extractHead = function (fpath, cb) {
  var sf = fs.createReadStream(fpath)
  var one = util.oneCallback(cb)
  var data = ''
  sf.on('data', function (chunk) {
    data += chunk
    if (data) {
      sf.destroy()
      sf.emit('end')
    }
  })
  sf.on('error', one)
  sf.on('end', util.oneCallback(function () {
    csv().from.string(data).to.array(function (recs) {
      one(null, recs[0])
    })
  }))
}

exports.makeVrt = function (fpath, cb) {
  extractHead(fpath, function (er, headers) {
    if (er) return cb(er)

    var geo = {}
    headers.forEach(function (header) {
      var ht = header.trim()
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

    if (!geo.geom && !geo.x) return cb(null, fpath) // no geometry fields, parse attributes

    var vrtData = util.tmpl(BASE_VRT, {
      file: fpath,
      name: path.basename(fpath, '.csv'),
      enc: geo.geom ? 'WKT' : 'PointFromColumns',
      encopt: geo.geom
                ? 'field="'+geo.geom+'"'
                : 'x="'+geo.x+'" y="'+geo.y+'"'
    })

    var vrtPath = util.genTmpPath()+'.vrt'
    return fs.writeFile(vrtPath, vrtData, function (er) {
      cb(er, vrtPath)
    })
  })
}
