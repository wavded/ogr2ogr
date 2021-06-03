import {Stream, Readable} from 'stream'
import {extname} from 'path'
import drivers from './drivers.json'
import {spawn} from 'child_process'
import type {GeoJSON} from 'geojson'
import {Buffer} from 'buffer'
// import {tmpdir} from 'os'
// import {join} from 'path'

type Input = string | GeoJSON | Stream
type Output = [Buffer | GeoJSON, string]
type Callback = (
  err: Error | null,
  stdout: Buffer | GeoJSON,
  stderr: string
) => void

interface Options {
  inputFormat?: string
  format?: string
}

interface Driver {
  format: string
  aliases: string[]
  output: string
}

class Ogr2ogr implements PromiseLike<Output> {
  private inputStream?: Readable
  private inputPath: string
  private outputDriver: Driver
  private outputPath: string

  constructor(input: Input, opts: Options = {}) {
    let inputDriver = this.parseDriver(opts.inputFormat)
    this.inputPath = inputDriver.format + ':/vsistdin/'
    this.outputDriver = this.parseDriver(opts.format)
    this.outputPath = '/vsistdout/'

    if (input instanceof Readable) {
      this.inputStream = input
    } else if (typeof input === 'string') {
      this.inputPath = this.parsePath(input)
    } else {
      this.inputStream = Readable.from([JSON.stringify(input)])
    }
  }

  stream() {
    return this.run()
  }

  exec(cb: Callback) {
    this.buffer()
      .then(([stdout, stderr]) => cb(null, stdout, stderr))
      .catch((err) => cb(err, Buffer.from(''), ''))
  }

  then<TResult1 = Output, TResult2 = never>(
    onfulfilled?: (value: Output) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: string) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.buffer().then(onfulfilled, onrejected)
  }

  async buffer(): Promise<Output> {
    let [stdout, stderr] = this.run()
    let [bufout, buferr] = await Promise.all([
      this.streamToBuffer(stdout),
      this.streamToBuffer(stderr),
    ])

    if (this.outputDriver.format === 'GeoJSON' && bufout.length > 0) {
      let data: GeoJSON = JSON.parse(bufout.toString())
      return [data, buferr.toString()]
    }
    return [bufout, buferr.toString()]
  }

  private async streamToBuffer(s: Readable): Promise<Buffer> {
    let chunks = []
    for await (let chunk of s) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
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
      path += '/vsicurl/'
    }

    path += p
    return path
  }

  private parseDriver(nameOrAlias = ''): Driver {
    let s = nameOrAlias.replace('.', '')
    return (
      drivers.find((d) => d.format === s || d.aliases.indexOf(s) > -1) ||
      drivers[0]
    )
  }

  private run() {
    let proc = spawn('ogr2ogr', [
      '-f',
      this.outputDriver.format,
      '-skipfailures',
      this.outputPath,
      this.inputPath,
    ])

    console.log(...proc.spawnargs)
    if (this.inputStream) this.inputStream.pipe(proc.stdin)
    return [proc.stdout, proc.stderr]
  }
}

export default function ogr2ogr(input: Input, opts?: Options) {
  return new Ogr2ogr(input, opts)
}
