"use strict"
var test = require('tap').test
var ogr2ogr = require('../')
var fs = require('fs')
var dir = __dirname+'/samples/'
var bufferStream = function (st, cb) {
  var data = []
  st.on('data', function (buf) { data.push(buf) })
  st.on('end', function () {
    data = Buffer.isBuffer(data[0]) ? Buffer.concat(data) : data.join('')
    cb(data)
  })
}

var files
var unsupported = [ 'sample.bad', 'sample.shp', 'sample.gfs' ]

test('load files', function (t) {
  fs.readdir(dir, function (er, f) {
    t.notOk(er, 'should load files', { error: er })
    files = f.filter(function (file) { return !~unsupported.indexOf(file) })
    t.ok(Array.isArray(files), 'array of files')
    t.end()
  })
})

test('convert to GeoJSON', function (t) {
  t.plan(files.length*2)

  files.forEach(function (file) {
    ogr2ogr(dir+file).exec(function (er, data) {
      t.notOk(er, 'should not return an error for '+file, { error: er })
      t.equal(data && data.type, 'FeatureCollection', file+' should have valid GeoJSON data')
    })
  })
})

test('convert to GeoJSON stream', function (t) {
  t.plan(files.length*2)

  files.forEach(function (file) {
    var st = ogr2ogr(dir+file).stream()
    var stErr

    st.on('error', function (er) { stErr = er })
    bufferStream(st, function (buf) {
      t.notOk(stErr, 'should not return an error for '+file, { error: stErr })
      var data = JSON.parse(buf)
      t.equal(data && data.type, 'FeatureCollection', file+' should have valid GeoJSON data')
    })
  })
})
