const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createStore } = require('../storage')

test('storage adapter pins reads and uses generation/metageneration write conditions', async () => {
  const calls = []
  const object = { generation: '90071992547409930', metageneration: '4' }
  const storage = { bucket: bucket => ({ file: (name, options) => {
    calls.push({ bucket, name, options })
    return {
      getMetadata: async () => [object],
      download: async () => [Buffer.from('image')],
      save: async (data, options) => calls.push({ data, options })
    }
  } }) }
  const store = createStore(storage)
  assert.deepEqual(await store.head('b', 'a'), object)
  await store.read('b', 'a', object.generation)
  assert.equal(calls[1].options.generation, object.generation)
  await store.write('b', 'a', Buffer.from('x'), { metadata: {} }, object)
  assert.deepEqual(calls.at(-1).options.preconditionOpts,
    { ifGenerationMatch: object.generation, ifMetagenerationMatch: '4' })
  await store.write('b', 'new', Buffer.from('x'), {}, null)
  assert.deepEqual(calls.at(-1).options.preconditionOpts, { ifGenerationMatch: 0 })
})
