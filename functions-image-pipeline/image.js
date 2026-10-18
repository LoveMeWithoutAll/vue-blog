const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const run = promisify(execFile)

function createTransform (execute = run, binary = 'convert') {
  return async function transform (input, orient, object = {}) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-image-'))
    // Use private, fixed basenames, never a user-controlled path or coder prefix.
    const candidate = path.posix.extname(object.name || '')
    const extension = /^\.[a-z0-9]+$/i.test(candidate) ? candidate : ''
    const originalPath = path.join(directory, `original${extension}`)
    const thumbnailPath = path.join(directory, `thumbnail${extension}`)
    try {
      await fs.writeFile(originalPath, input)
      if (orient) await execute(binary, [originalPath, '-auto-orient', originalPath])
      // Match the installed 0.1.5 extension's geometry and native codec behavior.
      await execute(binary, [originalPath, '-resize', '500x500>', thumbnailPath])
      const original = orient ? await fs.readFile(originalPath) : input
      const thumbnail = await fs.readFile(thumbnailPath)
      return { original, thumbnail }
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  }
}

module.exports = { createTransform, transform: createTransform() }
