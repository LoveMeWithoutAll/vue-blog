/* global process, setTimeout */
const assert = require('node:assert/strict')
const { Storage } = require('@google-cloud/storage')
const sharp = require('sharp')
async function main () {
  assert.equal(process.env.STORAGE_EMULATOR_HOST, 'http://127.0.0.1:9199')
  const bucket = new Storage({ projectId: 'demo-vue-blog-image-test' }).bucket('demo-vue-blog-image-test.appspot.com')
  const name = `images/integration-${Date.now()}.jpg`
  const thumb = name.replace('.jpg', '_500x500.jpg')
  const input = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#336699' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer()
  await bucket.file(name).save(input, { resumable: false, metadata: { contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: 'synthetic-original-token' } } })
  let ready = false
  for (let n = 0; n < 40; n++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    if ((await bucket.file(thumb).exists())[0]) { ready = true; break }
  }
  assert(ready, 'automatic finalized event must create thumbnail')
  const [originalMeta] = await bucket.file(name).getMetadata()
  const [thumbMeta] = await bucket.file(thumb).getMetadata()
  assert.equal(originalMeta.metadata.autoOrient, 'true')
  assert.equal(originalMeta.metadata.firebaseStorageDownloadTokens, 'synthetic-original-token')
  assert.notEqual(thumbMeta.metadata.firebaseStorageDownloadTokens, 'synthetic-original-token')
  const original = await sharp((await bucket.file(name).download())[0]).metadata()
  const resized = await sharp((await bucket.file(thumb).download())[0]).metadata()
  assert.deepEqual([original.width, original.height], [600, 800])
  assert.deepEqual([resized.width, resized.height], [375, 500])
  const generation = thumbMeta.generation
  await new Promise(resolve => setTimeout(resolve, 2000))
  assert.equal((await bucket.file(thumb).getMetadata())[0].generation, generation, 'self-trigger events must converge')
  console.log(JSON.stringify({ result: 'PASS', original: [original.width, original.height], thumbnail: [resized.width, resized.height], automaticTrigger: true, selfTriggerConverged: true }))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
