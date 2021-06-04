import {Stream, Readable} from 'stream'
import {extname} from 'path'
import {execFile} from 'child_process'
import {createReadStream} from 'fs'
// import {tmpdir} from 'os'
// import {join} from 'path'
//
type JSONLike = Record<string, unknown>
type RunOutput = {stdout: string; stderr: string}

type Input = string | JSONLike | Stream
interface Result {
  cmd: string
  text: string
  data?: JSONLike
  stream?: Readable
  details: string
}
type Callback = (err: Error | null, res?: Result) => void
interface Options {
  format?: string
}

// Known /vsistdout/ support.
const stdoutRe = /csv|geojson|georss|gml|gmt|gpx|jml|kml|mapml|pdf|vdv/i

class Ogr2ogr implements PromiseLike<Result> {
  private inputStream?: Readable
  private inputPath: string
  private outputPath: string
  private outputFormat: string

  constructor(input: Input, opts: Options = {}) {
    this.inputPath = '/vsistdin/'
    this.outputFormat = opts.format || 'GeoJSON'
    this.outputPath = stdoutRe.test(this.outputFormat)
      ? '/vsistdout/'
      : 'out.' + this.outputFormat.toLowerCase()

    if (input instanceof Readable) {
      this.inputStream = input
    } else if (typeof input === 'string') {
      this.inputPath = this.parsePath(input)
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
    onrejected?: (reason: string) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }

  private parsePath(p: string): string {
    let path = ''
    let ext = extname(p)

    switch (ext) {
      case '.zip':
      case '.kmz':
        path = '/vsizip/'
        break
      case '.gz':
        path = '/vsigzip/'
        break
      case '.tar':
        path = '/vsitar/'
        break
    }

    if (/^(http|ftp)/.test(p)) {
      path += '/vsicurl/' + p
      return path
    }

    path += p
    return path
  }

  private async run() {
    let command = 'ogr2ogr'
    let args = [
      '-f',
      this.outputFormat,
      '-skipfailures',
      this.outputPath,
      this.inputPath,
    ]

    let {stdout, stderr} = await new Promise<RunOutput>((res, rej) => {
      let proc = execFile(command, args, (err, stdout, stderr) => {
        if (err) rej(err)
        res({stdout, stderr})
      })
      if (this.inputStream && proc.stdin) this.inputStream.pipe(proc.stdin)
    })

    let res: Result = {
      cmd: command + args.join(' '),
      text: stdout,
      details: stderr,
    }

    if (/^geojson$/i.test(this.outputFormat)) {
      try {
        res.data = JSON.parse(stdout)
      } catch (err) {
        // ignore error
      }
    }

    if (this.outputPath !== '/vsistdout/') {
      res.stream = createReadStream(this.outputPath)
    }

    return res
  }
}

export default function ogr2ogr(input: Input, opts?: Options) {
  return new Ogr2ogr(input, opts)
}
