# ogr2ogr [![Build Status](https://jenkins.adc4gis.com/buildStatus/icon?job=ogr2ogr)](https://jenkins.adc4gis.com/job/ogr2ogr/)

ogr2ogr enables spatial file conversion and reprojection of spatial data through the use of ogr2ogr (gdal) tool

## Requirements

ogr2ogr requires the command line tool *ogr2ogr* - [gdal install page](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries).
It is recommended to use the latest version.

## Installation

    npm install ogr2ogr

[![NPM](https://nodei.co/npm/ogr2ogr.png?downloads=true)](https://nodei.co/npm/ogr2ogr)

## Usage

ogr2ogr takes either a path, a stream, or a GeoJSON object.  The result of the transformation can be consumed via callback or stream:

```js
var ogr2ogr = require('ogr2ogr')
var ogr = ogr2ogr('/path/to/spatial/file')

ogr.exec(function (er, data) {
  if (er) console.error(er)
  console.log(data)
})

var ogr2 = ogr2ogr('/path/to/another/spatial/file')
ogr2.stream().pipe(writeStream)
```

See `/examples` for usage examples and `/test/api.js`.

## Formats

The goal is for ogr2ogr to support most (if not all) formats your underlying ogr2ogr supports.  You can see the progress of that in `/tests/drivers.js`.

It also will:

1.  Extract zip files for formats that are typically bundled (i.e. shapefiles, kmz, s57, vrt, etc)
2.  Will extract geometry from CSVs when a common geometry field can be determined.
3.  Cleans up after its messes.
4.  Bundles multi-file conversions as a zip
5.  Support GeoJSON and GeoRSS urls as path inputs
6.  Support raw GeoJSON objects as input

## Options

ogr2ogr takes chainable modifier functions:

```js
var shapefile = ogr2ogr('/path/to/spatial/file.geojson')
					.format('ESRI Shapefile')
					.skipfailures()
					.stream()
shapefile.pipe(fs.createWriteStream('/shapefile.zip'))
```

Available options include:

* `.project(dest, src)` - reproject data (defaults to: "ESPG:4326")
* `.format(fmt)` - set output format (defaults to: "GeoJSON")
* `.timeout(ms)` - milliseconds before ogr2ogr is killed (defaults to: 15000)
* `.skipfailures()` - skip failures (continue after failure, skipping failed feature -- by default failures are not skipped)
* `.options(arr)` - array of custom org2ogr arguments (e.g. `['-fieldmap', '2,-1,4']`)
* `.destination(str)` -  ogr2ogr destination (directly tell ogr2ogr where the output should go, useful for writing to databases)

## License

(The MIT License)

Copyright (c) 2014 Marc Harter &lt;wavded@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
