import {Stream, Readable, PassThrough} from 'stream'
import {extname} from 'path'
import {createReadStream} from 'fs'
import drivers from './drivers.json'
import {spawn} from 'child_process'
import type {GeoJSON} from 'geojson'
import {Buffer} from 'buffer'

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
  inputFormat: string
  inputStream: Readable
  format: string

  constructor(input: Input, opts: Options = {}) {
    this.format = opts.format ?? 'GeoJSON'
    this.inputFormat = opts.inputFormat ?? 'GeoJSON'

    if (input instanceof Readable) {
      if (!opts.inputFormat) {
        throw new Error('Streams require the inputFormat option')
      }
      this.inputStream = input
    } else if (typeof input === 'string') {
      if (!opts.inputFormat) {
        let driver = this.driver(extname(input))
        this.inputFormat = driver ? driver.format : this.inputFormat
      }
      this.inputStream = createReadStream(input)
    } else {
      this.inputStream = Readable.from([JSON.stringify(input)])
    }
  }

  private driver(nameOrAlias: string): Driver | void {
    let search = nameOrAlias.replace('.', '')
    return drivers.find(
      (d) => d.format === search || d.aliases.indexOf(search) > -1
    )
  }

  private run() {
    let stdout = new PassThrough()
    let stderr = new PassThrough()

    let proc = spawn('ogr2ogr', [
      '-f',
      this.format,
      '/vsistdout/',
      this.inputFormat + ':/vsistdin/',
    ])

    console.log(...proc.spawnargs)
    this.inputStream.pipe(proc.stdin)
    proc.stdout.pipe(stdout)
    proc.stderr.pipe(stderr)

    return [stdout, stderr]
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

  private async streamToBuffer(s: Readable): Promise<Buffer> {
    let chunks = []
    for await (let chunk of s) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async buffer(): Promise<Output> {
    let [stdout, stderr] = this.run()
    let [bufout, buferr] = await Promise.all([
      this.streamToBuffer(stdout),
      this.streamToBuffer(stderr),
    ])

    if (this.format === 'GeoJSON' && bufout.length > 0) {
      let data: GeoJSON = JSON.parse(bufout.toString())
      return [data, buferr.toString()]
    }
    return [bufout, buferr.toString()]
  }
}

export default function ogr2ogr(input: Input, opts?: Options) {
  return new Ogr2ogr(input, opts)
}
