"use strict"
var fs = require('fs')
var when = require('when')
var nodefn = require('when/node/function')
var path = require('path')
var util = require('./util')
var writeFile = nodefn.lift(fs.writeFile)
var unlink = nodefn.lift(fs.unlink)

var BASE_VRT = '\n\
                <OGRVRTDataSource>\n\
                  <OGRVRTLayer name="{{name}}">\n\
                    <SrcDataSource>{{file}}</SrcDataSource>\n\
                    <GeometryField encoding="{{enc}}" {{encopt}} />\n\
                  </OGRVRTLayer>\n\
                </OGRVRTDataSource>'

function readFirstLine (fpath) {
  var d = when.defer()
  var sf = fs.createReadStream(fpath)
  var data = ''
  sf.on('readable', function () {
    data += sf.read()
    var lines = data.split('\n') // FIXME: not by any stretch a all inclusive CSV test
    if (lines.length > 1) {
      d.resolve(lines[0].replace('\r',''))
      sf.destroy()
    }
  })
  sf.on('error', d.reject)
  sf.on('end', d.resolve)
  return d.promise
}

exports.generateVrt = function (fpath) {
  return readFirstLine(fpath)
    .then(function (firstLn) {
      var headers = firstLn.split(',')

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

      if (!geo.geom && !geo.x) return fpath // if no geometry fields found, then just parse attributes

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

exports.cleanVrt = function (fpath) {
  if (path.extname(fpath) == '.vrt') return unlink(fpath)
}
