import test from "blue-tape"
import {
  createReadStream,
  createWriteStream,
  ReadStream,
  statSync,
  writeFileSync,
} from "fs"
import ogr2ogr from "./"

let dir = __dirname + "/testdata/"

test(async (t) => {
  const vers = await ogr2ogr.version()
  t.match(vers, /^GDAL /)

  interface TT {
    file?: string
    url?: string
    out?: string
    opts?: string[]
    dest?: string
    stream?: boolean
    success: boolean
  }
  let table: TT[] = [
    // URL tests.
    {
      url: "https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.geojson",
      success: true,
    },
    {
      url: "https://gist.github.com/wavded/7376428/raw/971548233e441615a426794c766223488492ddb9/test.georss",
      success: true,
    },

    // From format conversions.
    {file: "sample.bad", success: false},
    {file: "sample.empty.zip", success: false},
    {file: "sample.000", success: true},
    {file: "sample.csv", success: true},
    {file: "sample.dbf", success: true},
    {file: "sample.dgn", success: true},
    {file: "sample.dxf", success: true},
    {file: "sample.gdb.zip", out: "dxf", success: true},
    {file: "sample.geojson", success: true},
    {file: "sample.gml", success: true},
    {file: "sample.gmt", success: true},
    {file: "sample.gxt", success: true},
    {file: "sample.itf", success: true},
    {file: "sample.json", success: true},
    {file: "sample.jml", stream: true, success: true},
    {file: "sample.kml", success: true},
    {file: "sample.kmz", success: true},
    {file: "sample.cryllic.kml", success: true},
    {file: "sample.map.zip", success: true},
    {file: "sample.mapml", stream: true, success: true},
    {file: "sample.rss", success: true},
    {file: "sample.rti.zip", out: "dxf", success: true},
    {file: "sample.shp", success: true},
    {file: "sample.shp.zip", success: true},
    {file: "sample.large.shp.zip", success: true},
    {file: "sample.vdv", stream: true, success: true},

    // Using custom options.
    {
      file: "sample.no-shx.shp",
      opts: ["--config", "SHAPE_RESTORE_SHX", "TRUE"],
      success: true,
    },
    {
      file: "sample.geom.csv",
      opts: ["-oo", "GEOM_POSSIBLE_NAMES=the_geom"],
      success: true,
    },

    // To format conversions.
    {file: "sample.json", success: true, out: "csv"},
    {file: "sample.json", success: true, out: "dgn"},
    {file: "sample.json", success: true, out: "dxf"},
    {file: "sample.json", success: true, out: "esri shapefile"},
    {file: "sample.json", success: true, out: "flatgeobuf"},
    {file: "sample.json", success: true, out: "geoconcept"},
    {file: "sample.json", success: true, out: "geojson"},
    {file: "sample.json", success: true, out: "geojsonseq"},
    {file: "sample.json", success: true, out: "georss"},
    {file: "sample.json", success: true, out: "gml"},
    {file: "sample.json", success: true, out: "gmt"},
    {file: "sample.json", success: true, out: "gpkg"},
    {file: "sample.json", success: true, out: "gpx"},
    {file: "sample.json", success: true, out: "jml"},
    {file: "sample.json", success: true, out: "kml"},
    {file: "sample.json", success: true, out: "mapml"},
    {file: "sample.json", success: true, out: "mapinfo file"},
    {file: "sample.json", success: true, out: "ods"},
    {file: "sample.json", success: true, out: "pdf"},
    {file: "sample.json", success: true, out: "vdv"},
    {file: "sample.json", success: true, out: "xlsx"},

    // Known supported stream conversions.
    {file: "sample.csv", stream: true, success: false},
    {file: "sample.json", stream: true, success: true},
    {file: "sample.rss", stream: true, success: true},
    {file: "sample.gml", stream: true, success: true},
    {file: "sample.gmt", stream: true, success: true},
    {file: "sample.gpx", stream: true, success: true},
    {file: "sample.jml", stream: true, success: true},
    {file: "sample.kml", stream: true, success: true},
    {file: "sample.mapml", stream: true, success: true},
    {file: "sample.vdv", stream: true, success: true},

    // Custom destinations. (e.g. database)
    {
      file: "sample.json",
      success: true,
      dest: dir + "output/custom.geojson",
    },
  ]

  for (let tt of table) {
    try {
      let input: string | ReadStream = tt.url ? tt.url : dir + tt.file
      if (tt.stream) {
        input = createReadStream(input)
      }

      let res = await ogr2ogr(input, {
        format: tt.out,
        options: tt.opts,
        destination: tt.dest,
        maxBuffer: 1024 * 1024 * 1024,
      })

      if (tt.dest) {
        statSync(tt.dest)
        t.pass()
      } else if (!tt.out) {
        t.equal(res.data && res.data.type, "FeatureCollection", res.cmd)
      } else {
        t.ok(res.text || res.stream, res.cmd)

        let fn = dir + "output/r_" + tt.out + res.extname
        if (res.stream) {
          res.stream.pipe(createWriteStream(fn))
        } else {
          writeFileSync(fn, res.text)
        }
      }
      t.ok(tt.success)
    } catch (err) {
      console.log(err)
      t.notOk(tt.success)
    }
  }
})
