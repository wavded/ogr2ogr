# ogr2ogr [![Build Status](https://secure.travis-ci.org/wavded/ogr2ogr.png)](http://travis-ci.org/wavded/ogr2ogr)

ogr2ogr is the guts of [Ogre](https://github.com/wavded/ogre) extracted out into a simple ogr2ogr module.
It provides a streaming interface.  Its in progress.  Pull requests are welcome!

## Requirements

ogr2ogr requires the command line tool *ogr2ogr* to be installed - [gdal install page](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries).
It is recommended to use the latest complete version.

## Installation

    npm install ogr2ogr

[![NPM](https://nodei.co/npm/ogr2ogr.png?downloads=true)](https://nodei.co/npm/ogr2ogr)

## Usage

ogr2ogr returns a stream

```js
var ogr2ogr = require('ogr2ogr')
var stream = ogr2ogr('/path/to/spatial/file')
stream.pipe(process.stdout)
```

Any errors/warning that are outputted from ogr2ogr are provided in a special 'ogrerror' event:

```js
stream.on('ogrerror', console.log)
```

Any fatal errors use the streams 'error' event:

```js
stream.on('error', console.error)
```

## Formats

ogr2ogr supports any format your underlying ogr2ogr supports.  It also will:

1.  Extract zip files for formats that are typically bundled (i.e. shapefiles, kmz, s57, vrt, etc)
2.  Will extract geometry from CSVs when a common geometry field can be determined.
3.  Cleans up after its messes.

## Options

ogr2ogr takes a second options argument:

```js
var shapefile = ogr2ogr('/path/to/spatial/file.geojson', { output: 'ESRI Shapefile' })
shapefile.pipe(fs.createWriteStream('/shapefile.zip'))
```

Available options include:

* sourceSrs - source of the original file (defaults to: "ESPG:4326")
* targetSrs - reprojection of original (defaults to: "ESPG:4326")
* format - output format of the transformation (defaults to: "GeoJSON")

## License

(The MIT License)

Copyright (c) 2013 Marc Harter &lt;wavded@gmail.com&gt;

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
