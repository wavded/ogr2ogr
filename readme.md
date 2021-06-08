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
  // By default any input converts to GeoJSON
  let out = await ogr2ogr('/path/to/spatial/file')
  let geojson = out.data

  // Convert GeoJSON to ESRI Shapefile format
  out = await ogr2ogr(geojson, {format: 'ESRI Shapefile'})
  let rstream = out.stream

  // Stream ESRI Shapefile, output KML
  out = await ogr2ogr(rstream, {format: 'KML'})
  console.log(out.text)
})()
```

## API

### ogr2ogr(input, options?) -> output

The **`input`** may be one of:

- A path (`string`). This includes file paths and network paths including HTTP endpoints.
- A `ReadableStream`.
- A [GeoJSON][2] object.

The following **`options`** are available (none required):

- `format` - Output format (default: `GeoJSON`)
- `timeout` - Timeout before command forcibly terminated (default: `0`)
- `options` - Custom [ogr2ogr arguments][4] and [driver options][5] (e.g. `['--config', 'SHAPE_RESTORE_SHX', 'TRUE']`)
- `env` - Custom environmental variables (e.g. `{ATTRIBUTES_SKIP: 'YES'}`)
- `destination` - Select another output than the **output** object (e.g. useful for writing to databases).
- `command` - Command to run (default: `ogr2ogr`)

The **`output`** object has the following properties:

- `cmd` - The `ogr2ogr` command executed (useful for debugging).
- `text` - Text output from [drivers][3] that support returning text (like GeoRSS or KML)
- `data` - Parsed [GeoJSON][2] output (used when `format` is `GeoJSON`)
- `stream` - A `ReadableStream` of the output. Used for [drivers][3] that do not support returning text.
  - If a driver generates more than one file (like `ESRI Shapefile`), this will be a zip stream containing all the data.
- `extname` - The file extension of the data returned.
- `details` - Any text printed to `STDERR`. This includes any warnings reported by ogr2ogr when it ran.

## Community tips and tricks

Running `ogr2ogr` in a [Docker container][6]:

```javascript
ogr2ogr('/home/.../path/to/spatial/file', {
  command: 'docker run -v /home/:/home --rm osgeo/gdal ogr2ogr',
})
```

Converting an isolated `.shp` file:

```javascript
ogr2ogr('/path/to/file.shp', {
  options: ['--config', 'SHAPE_RESTORE_SHX', 'TRUE'],
})
```

Getting more debug information by using the [`CPL_DEBUG`][7] option. Debug info added to `details` on the **`output`** object.

```javascript
ogr2ogr('/path/to/file.shp', {
  options: ['--config', 'CPL_DEBUG', 'TRUE'],
})
```

[1]: https://gdal.org/download.html
[2]: https://geojson.org
[3]: https://gdal.org/drivers/vector/index.html
[4]: https://gdal.org/programs/ogr2ogr.html
[5]: https://gdal.org/drivers/vector/csv.html#open-options
[6]: https://github.com/OSGeo/gdal/tree/master/gdal/docker
[7]: https://trac.osgeo.org/gdal/wiki/ConfigOptions#CPL_DEBUG
