import {Stream, Readable} from 'stream'
import {extname} from 'path'
import {execFile} from 'child_process'
// import {tmpdir} from 'os'
// import {join} from 'path'
//
type JSONLike = Record<string, unknown>
type RunOutput = {stdout: string; stderr: string}

type Input = string | JSONLike | Stream
interface Result {
  command: string
  text: string
  data?: JSONLike
  stream?: Readable
  details: string
}
type Callback = (err: Error | null, res?: Result) => void
interface Options {
  format?: string
}

// const stdoutRe = /csv|gmt|gpx|geojson|esrijson|vdv|georss|kml|gml|mapml|pdf|wasp/i

class Ogr2ogr implements PromiseLike<Result> {
  private inputStream?: Readable
  private inputPath: string
  private outputPath: string
  private outputFormat: string

  constructor(input: Input, opts: Options = {}) {
    this.inputPath = '/vsistdin/'
    this.outputPath = '/vsistdout/'
    this.outputFormat = opts.format || 'GeoJSON'

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
        console.log(...proc.spawnargs, proc.exitCode)
        if (err) rej(err)
        res({stdout, stderr})
      })
      if (this.inputStream && proc.stdin) this.inputStream.pipe(proc.stdin)
    })

    let res: Result = {
      command: command + args.join(' '),
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

    return res
  }
}

export default function ogr2ogr(input: Input, opts?: Options) {
  return new Ogr2ogr(input, opts)
}
