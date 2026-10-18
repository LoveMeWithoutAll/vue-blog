const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { transform } = require('./image')
const run = promisify(execFile)

// Only bundled synthetic bytes and private temporary files; no Storage client.
async function verifyNativeRuntime () {
  const input = await fs.readFile(path.join(__dirname, 'runtime-fixture.jpg'))
  const output = await transform(input, true, { name: 'fixture.jpg' })
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-runtime-'))
  try {
    const dimensions = []
    for (const [name, bytes] of Object.entries(output)) {
      const file = path.join(directory, `${name}.jpg`)
      await fs.writeFile(file, bytes)
      const { stdout } = await run('convert', [file, '-format', '%wx%h', 'info:'])
      dimensions.push(stdout.trim())
    }
    if (dimensions.join(',') !== '600x800,375x500') {
      throw new Error(`Native runtime dimensions mismatch: ${dimensions.join(',')}`)
    }
    const { stdout } = await run('convert', ['-version'])
    return { original: dimensions[0], thumbnail: dimensions[1], version: stdout.split('\n')[0] }
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
}

module.exports = { verifyNativeRuntime }
