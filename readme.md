![Build Status](https://github.com/wavded/ogr2ogr/workflows/build/badge.svg?branch=master) [![NPM](https://img.shields.io/npm/v/ogr2ogr.svg)](https://npmjs.com/package/ogr2ogr) ![NPM Downloads](https://img.shields.io/npm/dt/ogr2ogr.svg)

Looking for V2 documentation? [Click here][9].

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
// Using CommonJS modules
const ogr2ogr = require('ogr2ogr').default
// Using ECMAScript modules or Typescript
import ogr2ogr from 'ogr2ogr'

// Promise API
(async() {
  // Convert path to GeoJSON.
  let {data} = await ogr2ogr('/path/to/spatial/file')
  console.log(data)

  // Convert GeoJSON object to ESRI Shapefile stream.
  let {stream} = await ogr2ogr(data, {format: 'ESRI Shapefile'})

  // Convert ESRI Shapefile stream to KML text.
  let {text} = await ogr2ogr(stream, {format: 'KML'})
  console.log(text)
})()

// Callback API
ogr2ogr('/path/to/spatial/file').exec((err, {data}) => {
  console.log(data)
})
```

## Formats

ogr2ogr has varying support for format input and output. Consult the particular [driver][3] you are interested in for more details. It is highly recommend to run the latest version of GDAL to get the best support. This project attempts to cast the widest net for support. Here are some notables:

| Drivers                                               | Output   | Notes                                       |
| ----------------------------------------------------- | -------- | ------------------------------------------- |
| GeoJSON                                               | `data`   | Default format returned when none specified |
| CSV, GeoRSS, GML, GMT, GPX, JML, KML, MapML, PDF, VDV | `text`   | Drivers supporting `/vsidout/` return text  |
| Other                                                 | `stream` | All other drivers return a file stream      |

## API

### ogr2ogr(input, options?) -> Promise\<output\>

The **`input`** may be one of:

- A path (`string`). This includes file paths and network paths including HTTP endpoints.
- A `ReadableStream`.
- A [GeoJSON][2] object.

The following **`options`** are available (none required):

- `format` - Output format (default: `GeoJSON`)
- `timeout` - Timeout, in milliseconds, before command forcibly terminated (default: `0`)
- `maxBuffer` - Max output size in bytes for stdout/stderr (default: `1024 * 1024 * 50`)
- `options` - Custom [ogr2ogr arguments][4] and [driver options][5] (e.g. `['--config', 'SHAPE_RESTORE_SHX', 'TRUE']`)
- `env` - Custom environmental variables (e.g. `{ATTRIBUTES_SKIP: 'YES'}`)
- `destination` - Select another output than the **output** object (e.g. useful for writing to databases).
- `command` - Command to run (default: `ogr2ogr`)

The **`output`** object has the following properties:

- `cmd` - The `ogr2ogr` command executed (useful for debugging).
- `text` - Text output from [drivers][3] that support `/vsistdout/` (see [formats](#formats) above)
- `data` - Parsed [GeoJSON][2] output (used when `format` is `GeoJSON`)
- `stream` - A `ReadableStream` of the output. Used for [drivers][3] that do not support `/vsistdout/`.
  - If a driver generates more than one file (like `ESRI Shapefile`), this will be a zip stream containing all the data.
- `extname` - The file extension of the data returned.
- `details` - Any text printed to `STDERR`. This includes any warnings reported by ogr2ogr when it ran.

### ogr2ogr(input, options?).exec((err, output))

The callback API supports the same options as above but in a NodeJS style callback format.

### ogr2ogr.version() -> Promise\<string\>

Retrieve the version of `ogr2ogr` that will be called by default by this library (same as calling `ogr2ogr --version` from command line).

```javascript
const version = await ogr2ogr.version()
console.log(version)

// GDAL X.X.X, released XXXX/XX/XX
```

## Tips and tricks

Running `ogr2ogr` in a [Docker container][6]:

```javascript
ogr2ogr("/home/.../path/to/spatial/file", {
  command: "docker run -v /home/:/home --rm osgeo/gdal ogr2ogr",
})
```

Converting an isolated `.shp` file:

```javascript
ogr2ogr("/path/to/file.shp", {
  options: ["--config", "SHAPE_RESTORE_SHX", "TRUE"],
})
```

Getting more debug information by using the [`CPL_DEBUG`][7] option. Debug info added to `details` on the **`output`** object.

```javascript
ogr2ogr("/path/to/file.shp", {
  options: ["--config", "CPL_DEBUG", "TRUE"],
})
```

Parsing custom geometry fields in a CSV. Use [CSV driver options][8], like:

```javascript
ogr2ogr("/path/to/file.csv", {
  options: ["-oo", "GEOM_POSSIBLE_NAMES=the_geom"],
})
```

Re-project geometry:

```javascript
ogr2ogr("/path/to/file.shp", {
  options: ["-t_srs", "EPSG:4326"],
})
```

[1]: https://gdal.org/download.html
[2]: https://geojson.org
[3]: https://gdal.org/drivers/vector/index.html
[4]: https://gdal.org/programs/ogr2ogr.html
[5]: https://gdal.org/drivers/vector/csv.html#open-options
[6]: https://github.com/OSGeo/gdal/tree/master/gdal/docker
[7]: https://trac.osgeo.org/gdal/wiki/ConfigOptions#CPL_DEBUG
[8]: https://gdal.org/drivers/vector/csv.html#open-options
[9]: https://github.com/wavded/ogr2ogr/tree/v2
