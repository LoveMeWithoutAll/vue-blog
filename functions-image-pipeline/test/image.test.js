const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')
const { createTransform, transform } = require('../image')

test('native invocation matches legacy operations and cleans private temp files', async () => {
  const calls = []
  const execute = async (binary, args) => {
    calls.push({ binary, args })
    if (args[1] === '-resize') await fs.copyFile(args[0], args[3])
  }
  const input = Buffer.from('fixture')
  await createTransform(execute)(input, true, { name: '../../outside/photo.gif' })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].binary, 'convert')
  assert.equal(calls[0].args[1], '-auto-orient')
  assert.equal(calls[0].args[0], calls[0].args[2])
  assert.equal(path.basename(calls[0].args[0]), 'original.gif')
  assert.equal(calls[1].args[2], '500x500>')
  await assert.rejects(fs.stat(path.dirname(calls[0].args[0])), { code: 'ENOENT' })
})

test('failed conversion cleans its temporary directory', async () => {
  let directory
  const execute = async (binary, args) => {
    directory = path.dirname(args[0])
    throw new Error('codec failure')
  }
  await assert.rejects(createTransform(execute)(Buffer.from('bad'), true), /codec failure/)
  await assert.rejects(fs.stat(directory), { code: 'ENOENT' })
})

test('animated GIF retains frames, delays, looping and GIF output', async () => {
  const width = 600
  const height = 300
  const red = Buffer.alloc(width * height * 3)
  const blue = Buffer.alloc(width * height * 3)
  for (let i = 0; i < red.length; i += 3) { red[i] = 255; blue[i + 2] = 255 }
  const gif = await sharp(Buffer.concat([red, blue]), {
    raw: { width, height: height * 2, channels: 3, pageHeight: height }
  }).gif({ loop: 3, delay: [100, 200] }).toBuffer()
  const result = await transform(gif, true, { name: 'animated.gif' })
  const original = await sharp(result.original, { animated: true }).metadata()
  const thumb = await sharp(result.thumbnail, { animated: true }).metadata()
  assert.equal(original.pages, 2)
  assert.equal(thumb.pages, 2)
  assert.equal(thumb.format, 'gif')
  assert.equal(thumb.width, 500)
  assert.equal(thumb.pageHeight, 250)
  assert.deepEqual(thumb.delay, [100, 200])
  assert.equal(thumb.loop, 3)
})

test('TIFF is no longer excluded by a new format allowlist', async () => {
  const image = await sharp({ create: { width: 600, height: 300,
    channels: 3, background: 'red' } }).tiff().toBuffer()
  const result = await transform(image, true, { name: 'photo.tiff' })
  const thumb = await sharp(result.thumbnail).metadata()
  assert.equal(thumb.format, 'tiff')
  assert.equal(thumb.width, 500)
  assert.equal(thumb.height, 250)
})

test('valid input over 25 MiB is processed without an application byte limit', async () => {
  const png = await sharp({ create: { width: 20, height: 10,
    channels: 3, background: 'red' } }).png().toBuffer()
  const large = Buffer.concat([png, Buffer.alloc(26 * 1024 * 1024)])
  const result = await transform(large, true, { name: 'large.png' })
  assert.equal((await sharp(result.thumbnail).metadata()).width, 20)
})

test('image above 40 MP is processed without the new pixel restriction', async () => {
  const input = await sharp({ create: { width: 8001, height: 5001,
    channels: 3, background: 'white' } }).png().toBuffer()
  const result = await transform(input, false, { name: 'large.png' })
  const thumb = await sharp(result.thumbnail).metadata()
  assert.equal(thumb.width, 500)
  assert.equal(thumb.height, 313)
})
