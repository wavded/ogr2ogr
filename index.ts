import archiver from "archiver"
import {execFile} from "child_process"
import {createReadStream} from "fs"
import {tmpdir} from "os"
import {extname, join} from "path"
import {Readable, Stream} from "stream"

type JSONLike = Record<string, unknown>
type RunOutput = {stdout: string; stderr: string}

type Input = string | JSONLike | Stream
interface Result {
  cmd: string
  text: string
  data?: JSONLike
  stream?: Readable
  extname?: string
  details: string
}
type Callback = (err: Error | null, res?: Result) => void
interface Options {
  command?: string
  format?: string
  options?: string[]
  destination?: string
  env?: Record<string, string>
  timeout?: number
  maxBuffer?: number
}

// Known /vsistdout/ support.
const stdoutRe = /csv|geojson|georss|gml|gmt|gpx|jml|kml|mapml|pdf|vdv/i
const vsiStdIn = "/vsistdin/"
const vsiStdOut = "/vsistdout/"

let uniq = Date.now()

class Ogr2ogr implements PromiseLike<Result> {
  private inputStream?: Readable
  private inputPath: string
  private outputPath: string
  private outputFormat: string
  private outputExt: string
  private customCommand?: string
  private customOptions?: string[]
  private customDestination?: string
  private customEnv?: Record<string, string>
  private timeout: number
  private maxBuffer: number

  constructor(input: Input, opts: Options = {}) {
    this.inputPath = vsiStdIn
    this.outputFormat = opts.format ?? "GeoJSON"
    this.customCommand = opts.command
    this.customOptions = opts.options
    this.customDestination = opts.destination
    this.customEnv = opts.env
    this.timeout = opts.timeout ?? 0
    this.maxBuffer = opts.maxBuffer ?? 1024 * 1024 * 50

    let {path, ext} = this.newOutputPath(this.outputFormat)
    this.outputPath = path
    this.outputExt = ext

    if (input instanceof Readable) {
      this.inputStream = input
    } else if (typeof input === "string") {
      this.inputPath = this.newInputPath(input)
    } else {
      this.inputStream = Readable.from([JSON.stringify(input)])
    }
  }

  exec(cb: Callback) {
    this.run()
      .then((res) => cb(null, res))
      .catch((err) => cb(err))
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: (value: Result) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: string) => TResult2 | PromiseLike<TResult2>,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }

  private newInputPath(p: string): string {
    let path = ""
    let ext = extname(p)

    switch (ext) {
      case ".zip":
      case ".kmz":
      case ".shz":
        path = "/vsizip/"
        break
      case ".gz":
        path = "/vsigzip/"
        break
      case ".tar":
        path = "/vsitar/"
        break
    }

    if (/^(http|ftp)/.test(p)) {
      path += "/vsicurl/" + p
      return path
    }

    path += p
    return path
  }

  private newOutputPath(f: string) {
    let ext = "." + f.toLowerCase()

    if (stdoutRe.test(this.outputFormat)) {
      return {path: vsiStdOut, ext}
    }

    let path = join(tmpdir(), "/ogr_" + uniq++)

    switch (f.toLowerCase()) {
      case "esri shapefile":
        path += ".shz"
        ext = ".shz"
        break
      case "mapinfo file":
      case "flatgeobuf":
        ext = ".zip"
        break
      default:
        path += ext
    }

    return {path, ext}
  }

  private createZipStream(p: string) {
    let archive = archiver("zip")
    archive.directory(p, false)
    archive.on("error", console.error)
    archive.finalize()
    return archive
  }

  private async run() {
    let command = this.customCommand ?? "ogr2ogr"
    let args = [
      "-f",
      this.outputFormat,
      "-skipfailures",
      this.customDestination || this.outputPath,
      this.inputPath,
    ]
    if (this.customOptions) args.push(...this.customOptions)
    let env = this.customEnv ? {...process.env, ...this.customEnv} : undefined

    let {stdout, stderr} = await new Promise<RunOutput>((res, rej) => {
      let proc = execFile(
        command,
        args,
        {env, timeout: this.timeout, maxBuffer: this.maxBuffer},
        (err, stdout, stderr) => {
          if (err) rej(err)
          res({stdout, stderr})
        },
      )
      if (this.inputStream && proc.stdin) this.inputStream.pipe(proc.stdin)
    })

    let res: Result = {
      cmd: [command, ...args].join(" "),
      text: stdout,
      details: stderr,
      extname: this.outputExt,
    }

    if (/^geojson$/i.test(this.outputFormat)) {
      try {
        res.data = JSON.parse(stdout)
      } catch (err) {
        // ignore error
      }
    }

    if (!this.customDestination && this.outputPath !== vsiStdOut) {
      if (this.outputExt === ".zip") {
        res.stream = this.createZipStream(this.outputPath)
      } else {
        res.stream = createReadStream(this.outputPath)
      }
    }

    return res
  }
}

function ogr2ogr(input: Input, opts?: Options): Ogr2ogr {
  return new Ogr2ogr(input, opts)
}

ogr2ogr.version = async () => {
  let vers = await new Promise<string>((res, rej) => {
    execFile("ogr2ogr", ["--version"], {}, (err, stdout) => {
      if (err) rej(err)
      res(stdout)
    })
  })
  return vers.trim()
}

export default ogr2ogr
