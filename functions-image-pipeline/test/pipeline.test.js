const { test } = require('node:test')
const assert = require('node:assert/strict')
const sharp = require('sharp')
const { createHandler, transform, outputName } = require('../pipeline')

function fakeStore () {
  const files = new Map()
  const writes = []
  let generation = 100n
  const key = (bucket, name) => `${bucket}/${name}`
  const store = {
    files, writes,
    put (name, data, custom = {}, fields = {}) {
      const object = { bucket: 'test', name, generation: String(++generation),
        metageneration: '1', size: String(data.length), contentType: 'image/png',
        metadata: custom, ...fields }
      files.set(key('test', name), { data, object })
      return structuredClone(object)
    },
    async head (bucket, name) {
      return structuredClone(files.get(key(bucket, name))?.object || null)
    },
    async read (bucket, name, expected) {
      const file = files.get(key(bucket, name))
      assert.equal(file.object.generation, expected, 'must read exact source generation')
      return file.data
    },
    async write (bucket, name, data, metadata, previous) {
      const current = await store.head(bucket, name)
      if ((current?.generation || 0) !== (previous?.generation || 0) ||
          current?.metageneration !== previous?.metageneration) {
        throw Object.assign(new Error('precondition'), { code: 412 })
      }
      writes.push(name)
      return store.put(name, data, metadata.metadata, metadata)
    }
  }
  return store
}

async function png (width = 800, height = 400) {
  return sharp({ create: { width, height, channels: 4,
    background: { r: 200, g: 50, b: 20, alpha: 0.5 } } }).png().toBuffer()
}

test('legacy names preserve directories, dots, extensionless and Unicode names', () => {
  assert.equal(outputName('images/a.b.jpg'), 'images/a.b_500x500.jpg')
  assert.equal(outputName('images/책'), 'images/책_500x500')
  assert.equal(outputName('images/sub/../a.png'), 'images/a_500x500.png')
})

test('real EXIF rotation normalizes original and then resizes within 500x500', async () => {
  const jpeg = await sharp(await png(800, 400)).jpeg().withMetadata({ orientation: 6 }).toBuffer()
  const { original, thumbnail } = await transform(jpeg, true)
  const full = await sharp(original).metadata()
  const small = await sharp(thumbnail).metadata()
  assert.equal(full.width, 400)
  assert.equal(full.height, 800)
  assert.equal(small.width, 250)
  assert.equal(small.height, 500)
  assert.ok(!full.orientation || full.orientation === 1)
})

test('small PNG remains small with alpha; marked originals retain exact bytes', async () => {
  const input = await png(90, 60)
  const { original, thumbnail } = await transform(input, false)
  assert.equal(original, input)
  const info = await sharp(thumbnail).metadata()
  assert.equal(info.width, 90)
  assert.equal(info.height, 60)
  assert.equal(info.hasAlpha, true)
})

test('WebP stays WebP and portrait geometry is bounded without cropping', async () => {
  const input = await sharp(await png(600, 900)).webp().toBuffer()
  const result = await transform(input, true)
  const image = await sharp(result.thumbnail).metadata()
  assert.equal(image.format, 'webp')
  assert.equal(image.width, 333)
  assert.equal(image.height, 500)
  assert.equal(image.hasAlpha, true)
})

test('missing metadata works; original path/token and HTTP metadata survive', async () => {
  const store = fakeStore()
  const event = store.put('images/photo.png', await png(), { firebaseStorageDownloadTokens: 'original-token', author: 'test' },
    { cacheControl: 'public,max-age=3600', contentDisposition: 'inline', contentLanguage: 'ko' })
  const handler = createHandler(store)
  assert.equal(await handler(event), 'processed')
  const original = await store.head('test', event.name)
  const thumbnail = await store.head('test', 'images/photo_500x500.png')
  assert.equal(original.metadata.firebaseStorageDownloadTokens, 'original-token')
  assert.equal(original.metadata.autoOrient, 'true')
  assert.equal(thumbnail.metadata.firebaseStorageDownloadTokens, undefined)
  assert.equal(thumbnail.metadata.resizedImage, 'true')
  assert.equal(thumbnail.metadata.author, 'test')
  assert.equal(thumbnail.cacheControl, event.cacheControl)
  assert.equal(thumbnail.contentDisposition, event.contentDisposition)
  assert.equal(thumbnail.contentLanguage, 'ko')
  const before = store.writes.length
  assert.equal(await handler(event), 'complete')
  assert.equal(await handler(original), 'complete')
  assert.equal(await handler(thumbnail), 'thumbnail')
  assert.equal(store.writes.length, before)
  const bare = store.put('bare.png', await png(), undefined)
  delete bare.metadata
  assert.equal(await handler(bare), 'processed')
})

test('legacy rotated original is not rewritten and existing derivative URL token survives', async () => {
  const store = fakeStore()
  store.put('photo_500x500.png', await png(100, 50), { resizedImage: 'true', firebaseStorageDownloadTokens: 'thumbnail-token' })
  const event = store.put('photo.png', await png(), { autoOrient: 'true', firebaseStorageDownloadTokens: 'original-token' })
  await createHandler(store)(event)
  assert.deepEqual(store.writes, ['photo_500x500.png'])
  assert.equal((await store.head('test', 'photo_500x500.png')).metadata.firebaseStorageDownloadTokens, 'thumbnail-token')
})

test('parallel duplicate delivery uses CAS; retry completes with no repeated rotation', async () => {
  const store = fakeStore()
  const event = store.put('photo.png', await png())
  const handler = createHandler(store)
  const results = await Promise.allSettled([handler(event), handler(event)])
  assert.ok(results.some(result => result.status === 'fulfilled'))
  for (const result of results) {
    if (result.status === 'rejected') assert.equal(result.reason.code, 412)
  }
  await handler(event)
  assert.equal(store.writes.filter(name => name === 'photo.png').length, 1)
  assert.equal(store.writes.filter(name => name === 'photo_500x500.png').length, 1)
})

test('failure after rotation can resume from original event', async () => {
  const store = fakeStore()
  const event = store.put('photo.png', await png())
  const write = store.write
  let fail = true
  store.write = async (...args) => {
    if (args[1].includes('_500x500') && fail) {
      fail = false
      throw new Error('transient storage failure')
    }
    return write(...args)
  }
  const handler = createHandler(store)
  await assert.rejects(handler(event), /transient/)
  assert.equal(await handler(event), 'processed')
  assert.equal(store.writes.filter(name => name === 'photo.png').length, 1)
})

test('new upload during rotation cannot be overwritten by stale worker', async () => {
  const store = fakeStore()
  const old = store.put('photo.png', await png())
  const newer = await png(600, 900)
  const handler = createHandler(store, async (...args) => {
    const result = await transform(...args)
    store.put('photo.png', newer)
    return result
  })
  await assert.rejects(handler(old), { code: 412 })
  assert.equal(await createHandler(store)(old), 'stale')
  assert.deepEqual(store.files.get('test/photo.png').data, newer)
})

test('newer generation thumbnail cannot be replaced by delayed old event', async () => {
  const store = fakeStore()
  const old = store.put('photo.png', await png(), { autoOrient: 'true' })
  const fresh = store.put('photo.png', await png(900, 600), { autoOrient: 'true' })
  const handler = createHandler(store)
  await handler(fresh)
  assert.equal(await handler(old), 'stale')
  assert.equal((await store.head('test', 'photo_500x500.png')).metadata.blogPipelineSourceGeneration, fresh.generation)
})

test('same-name reupload refreshes both images and retains their independent tokens', async () => {
  const store = fakeStore()
  const handler = createHandler(store)
  const first = store.put('photo.png', await png(), { firebaseStorageDownloadTokens: 'original-one' })
  await handler(first)
  store.files.get('test/photo_500x500.png').object.metadata.firebaseStorageDownloadTokens = 'derivative-token'
  const second = store.put('photo.png', await png(600, 900), { firebaseStorageDownloadTokens: 'original-two' })
  await handler(second)
  const original = await store.head('test', 'photo.png')
  const thumbnail = await store.head('test', 'photo_500x500.png')
  assert.equal(original.metadata.firebaseStorageDownloadTokens, 'original-two')
  assert.equal(thumbnail.metadata.firebaseStorageDownloadTokens, 'derivative-token')
  assert.equal(thumbnail.metadata.blogPipelineSourceGeneration, original.generation)
  const dimensions = await sharp(store.files.get('test/photo_500x500.png').data).metadata()
  assert.equal(dimensions.width, 333)
  assert.equal(dimensions.height, 500)
  assert.equal(await handler(first), 'stale')
})

test('suffix alone does not exclude legitimate source images; derivative metadata does', async () => {
  const store = fakeStore()
  const source = store.put('my_500x500.png', await png())
  const handler = createHandler(store)
  assert.equal(await handler(source), 'processed')
  const derivative = await store.head('test', 'my_500x500_500x500.png')
  assert.equal(await handler(derivative), 'thumbnail')
})

test('source metadata edit during processing is not silently overwritten', async () => {
  const store = fakeStore()
  const event = store.put('photo.png', await png())
  const handler = createHandler(store, async (...args) => {
    const result = await transform(...args)
    const current = store.files.get('test/photo.png').object
    current.metageneration = '2'
    current.metadata.firebaseStorageDownloadTokens = 'new-token'
    return result
  })
  await assert.rejects(handler(event), { code: 412 })
  await createHandler(store)(event)
  assert.equal((await store.head('test', 'photo.png')).metadata.firebaseStorageDownloadTokens, 'new-token')
})

test('old worker cannot overwrite newer thumbnail committed after its last source check', async () => {
  const store = fakeStore()
  const old = store.put('photo.png', await png(), { autoOrient: 'true' })
  const write = store.write
  let intervene = true
  let fresh
  store.write = async (...args) => {
    if (args[1] === 'photo_500x500.png' && intervene) {
      intervene = false
      fresh = store.put('photo.png', await png(900, 600), { autoOrient: 'true' })
      await createHandler(store)(fresh)
    }
    return write(...args)
  }
  await assert.rejects(createHandler(store)(old), { code: 412 })
  assert.equal((await store.head('test', 'photo_500x500.png')).metadata.blogPipelineSourceGeneration, fresh.generation)
})

test('metadata edit on an oriented original retries instead of losing thumbnail work', async () => {
  const store = fakeStore()
  const event = store.put('photo.png', await png(), { autoOrient: 'true' })
  const handler = createHandler(store, async (...args) => {
    const result = await transform(...args)
    const current = store.files.get('test/photo.png').object
    current.metageneration = '2'
    current.metadata.author = 'updated'
    return result
  })
  await assert.rejects(handler(event), { code: 412 })
  await createHandler(store)(event)
  assert.equal((await store.head('test', 'photo_500x500.png')).metadata.author, 'updated')
})

test('deletion and overwrite after transform stop an old thumbnail write', async () => {
  const store = fakeStore()
  const event = store.put('photo.png', await png(), { autoOrient: 'true' })
  const handler = createHandler(store, async (...args) => {
    const result = await transform(...args)
    store.files.delete('test/photo.png')
    return result
  })
  assert.equal(await handler(event), 'superseded')
  assert.equal(store.writes.length, 0)
})

test('skip non-images, missing MIME and derivative events; never enumerate historical files', async () => {
  const store = fakeStore()
  const handler = createHandler(store)
  assert.equal(await handler({ name: 'a', bucket: 'test', generation: '1' }), 'not-image')
  const text = store.put('a.txt', Buffer.from('a'), {}, { contentType: 'text/plain' })
  assert.equal(await handler(text), 'not-image')
  const historical = store.put('old.png', await png())
  assert.equal(store.writes.length, 0)
  assert.equal((await store.head('test', historical.name)).generation, historical.generation)
})

test('reject path collision and corrupt input without writes', async () => {
  const store = fakeStore()
  const handler = createHandler(store)
  store.put('photo_500x500.png', await png())
  const event = store.put('photo.png', await png())
  await assert.rejects(handler(event), /collides/)
  const corrupt = store.put('bad.png', Buffer.from('not an image'))
  await assert.rejects(handler(corrupt))
  assert.deepEqual(store.writes, [])
})

test('no new 25 MiB admission limit is imposed on metadata size', async () => {
  const store = fakeStore()
  const event = store.put('large.png', await png(), {}, { size: String(26 * 1024 * 1024) })
  assert.equal(await createHandler(store)(event), 'processed')
})
