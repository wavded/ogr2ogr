![Build Status](https://github.com/wavded/ogr2ogr/workflows/build/badge.svg?branch=master) [![NPM](https://img.shields.io/npm/v/ogr2ogr.svg)](https://npmjs.com/package/ogr2ogr) ![NPM Downloads](https://img.shields.io/npm/dt/ogr2ogr.svg)

ogr2ogr wraps the `ogr2ogr` GDAL tool to enable file conversion and re-projection of spatial data in simplified friendly API.

## Installation

1. [Install GDAL tools][1] (includes the `ogr2ogr` command line tool)

2. Install package:

```sh
npm install ogr2ogr
```

## Usage

ogr2ogr takes either a path, a stream, or a [GeoJSON][2] object. The result of the transformation will depend on the format returned.

```javascript
const ogr2ogr = require('ogr2ogr')

(async() {
  // By default any input converts to GeoJSON.
  let out = await ogr2ogr('/path/to/spatial/file')
  console.log(out.data)
})()
```

## API

### ogr2ogr(input, options?) -> output

The **`input`** may be one of:

- A path (`string`). This includes file paths and network paths including HTTP endpoints.
- A `ReadableStream`. An `inputFormat` should be supplied if something other than GeoJSON.
- A [GeoJSON][2] object.

The following **`options`** are available (none required):

- `format` - Output format (default: `GeoJSON`)
- `timeout` - Timeout before command forcibly terminated (default: `0`)
- `options` - Custom ogr2ogr arguments (e.g. `['--config', 'SHAPE_RESTORE_SHX', 'TRUE']`)
- `env` - Custom environmental variables (e.g. `{ATTRIBUTES_SKIP: 'YES'}`)
- `destination` - Select another output than the **output** object (e.g. useful for writing to databases).

The **`output`** object has the following properties:

- `cmd` - The `ogr2ogr` command executed (useful for debugging).
- `text` - Text output from drivers that support returning text (like GeoRSS or KML)
- `data` - Parsed [GeoJSON][2] output if exists.
- `stream` - A `ReadableStream` of the output. Used for drivers that do not support returning text.
  - If a driver returns multiple files (like `ESRI Shapefile`), this will be a zip stream containing all the data.
- `extname` - The file extension of the data returned.
- `details` - Any text printed to `STDERR`. This includes any warnings reported by ogr2ogr when it ran.

## Tips and tricks

# Configuring the base ogr2ogr command

An alternative to installing GDAL, you can invoke ogr2ogr via a [GDAL Docker image](https://hub.docker.com/r/osgeo/gdal) instead. Do this by configuring the base command that is executed to invoke the ogr2ogr CLI.

```javascript
var ogr2ogr = require('ogr2ogr')

ogr2ogr('/home/.../path/to/spatial/file')
  .command(
    'docker run -v /home/:/home --rm osgeo/gdal:alpine-small-latest ogr2ogr'
  )
  .exec(function (er, data) {
    if (er) console.error(er)
    console.log(data)
  })
```

# Formats

The goal is for ogr2ogr to support most (if not all) formats your underlying ogr2ogr supports. You can see the progress of that in `/tests/drivers.js`.

It also will:

1. Extract zip files for formats that are typically bundled (i.e. shapefiles, kmz, s57, vrt, etc)
2. Will extract geometry from CSVs when a common geometry field can be determined.
3. Cleans up after its messes.
4. Bundles multi-file conversions as a zip
5. Support GeoJSON and GeoRSS urls as path inputs
6. Support raw GeoJSON objects as input

# Options

ogr2ogr takes chainable modifier functions:

```javascript
var shapefile = ogr2ogr('/path/to/spatial/file.geojson')
  .format('ESRI Shapefile')
  .skipfailures()
  .stream()
shapefile.pipe(fs.createWriteStream('/shapefile.zip'))
```

Available options include:

- `.project(dest, src)` - reproject data (defaults to: "ESPG:4326")
- `.format(fmt)` - set output format (defaults to: "GeoJSON")
- `.timeout(ms)` - milliseconds before ogr2ogr is killed (defaults to: 15000)
- `.skipfailures()` - skip failures (continue after failure, skipping failed feature -- by default failures are not skipped)
- `.env(obj)` - object of custom ogr2ogr ENV configuration parameters (e.g. `{ ATTRIBUTES_SKIP: 'YES' }`)
- `.options(arr)` - array of custom ogr2ogr arguments (e.g. `['-fieldmap', '2,-1,4']`)
- `.destination(str)` - ogr2ogr destination (directly tell ogr2ogr where the output should go, useful for writing to databases)
- `.onStderr(callback)` - execute a callback function whose parameter is the debug output of ogr2ogr to stderr

## Example of onStderr usage

If you want to debug what is the ogr2ogr binary doing internally, you can attach a callback to the output,
provided you have passed the option [CPL_DEBUG](https://trac.osgeo.org/gdal/wiki/ConfigOptions#CPL_DEBUG)

```javascript
var shapefile = ogr2ogr('/path/to/spatial/file.geojson')
  .format('ESRI Shapefile')
  .skipfailures()
  .options(['--config', 'CPL_DEBUG', 'ON'])
  .onStderr(function (data) {
    console.log(data)
  })
  .stream()
shapefile.pipe(fs.createWriteStream('/shapefile.zip'))
```

You will see in the console someting in the likes of

```sh
GDAL: GDALOpen(/tmp/ogr_542cb61092c/sample.shp, this=0x15ca370) succeeds as ESRI Shapefile.

GDAL: GDALDriver::Create(PGDUMP,/vsistdout/,0,0,0,Unknown,(nil))
PGDump: LaunderName('ID') -> 'id'
PGDump: LaunderName('FIPSSTCO') -> 'fipsstco'
PGDump: LaunderName('STATE') -> 'state'
PGDump: LaunderName('COUNTY') -> 'county'
GDALVectorTranslate: 1 features written in layer 'sample'
Shape: 1 features read on layer 'sample'.
GDAL: GDALClose(/tmp/ogr_542cb61092c/sample.shp, this=0x15ca370)
GDAL: GDALClose(/vsistdout/, this=0x157ded0)
```

This can be useful when something goes wrong and the error provided by this library doesn't provide enough information.

## Conversion of `shp` files

It is trivial to handle the conversion of ESRI Shapefiles when they are packed in a zipfile that contains (at least) the `shp` and `shx` files.
This library is also capable of converting uncompresses ESRI Shapefiles if you use the `shp` file as the input file
**and the shx file is in the same folder**.

However, it is also possible to convert single `shp` files that lack an `shx` file by forcing its creation
using ogr2ogr option [SHAPE_RESTORE_SHX](https://trac.osgeo.org/gdal/wiki/ConfigOptions#SHAPE_RESTORE_SHX) provided you have installed
GDAL/OGR version 2.1.0 or newer.

```javascript
var geojson = ogr2ogr('/path/to/spatial/lonely.shp')
  .options(['--config', 'SHAPE_RESTORE_SHX', 'TRUE'])
  .stream()

geojson.pipe(fs.createWriteStream('/lonely.json'))
```

**Caveat**: ogr2ogr will do its best to infer the corresponding `shx`. However, there's no guarantee it will success.

[1]: http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries
[2]: https://geojson.org
