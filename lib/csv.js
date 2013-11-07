"use strict"
var fs = require('fs')
var when = require('when')
var nodefn = require('when/node/function')
var path = require('path')
var csv = require('csv')
var util = require('./util')
var writeFile = nodefn.lift(fs.writeFile)

var BASE_VRT = '<OGRVRTDataSource>\n\
                  <OGRVRTLayer name="{{name}}">\n\
                    <SrcDataSource>{{file}}</SrcDataSource>\n\
                    <GeometryField encoding="{{enc}}" {{encopt}} />\n\
                  </OGRVRTLayer>\n\
                </OGRVRTDataSource>'

var extractHead = function (fpath) {
  var d = when.defer()
  var sf = fs.createReadStream(fpath)
  var data = ''
  sf.on('data', function (chunk) {
    data += chunk
    if (data) sf.destroy()
  })
  sf.on('error', d.reject)
  sf.on('end', function () {
    csv().from.string(data).to.array(function (recs) {
      d.resolve(recs[0])
    })
  })
  return d.promise
}

exports.makeVrt = function (fpath) {
  var p = extractHead(fpath)

  return p.then(function (headers) {
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

    if (!geo.geom && !geo.x) return fpath // no geometry fields, parse attributes

    var vrtData = util.tmpl(BASE_VRT, {
      file: fpath,
      name: path.basename(fpath, '.csv'),
      enc: geo.geom ? 'WKT' : 'PointFromColumns',
      encopt: geo.geom
                ? 'field="'+geo.geom+'"'
                : 'x="'+geo.x+'" y="'+geo.y+'"'
    })

    var vrtPath = util.genTmpPath()+'.vrt'
    return writeFile(vrtPath, vrtData).then(function () {
      return vrtPath
    })
  })
}
