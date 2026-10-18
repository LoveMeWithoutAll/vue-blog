const path = require('node:path').posix
const { transform } = require('./image')

const INPUT = 'blogPipelineInputGeneration'
const SOURCE = 'blogPipelineSourceGeneration'
const OWNER = 'blogPipelineSourceName'

function outputName (name) {
  const extension = path.extname(name)
  return path.join(path.dirname(name), `${path.basename(name, extension)}_500x500${extension}`)
}

function metadataFor (object, custom) {
  const result = { metadata: custom }
  for (const key of ['contentType', 'cacheControl', 'contentDisposition', 'contentLanguage']) {
    if (object[key] !== undefined) result[key] = object[key]
  }
  // Downloads may be decoded by Storage; do not claim transformed bytes are gzip.
  return result
}

function createHandler (store, processImage = transform) {
  return async function processObject (event) {
    if (!event || !event.name || !event.bucket || !event.generation) return 'invalid-event'
    if (!event.contentType?.startsWith('image/')) return 'not-image'
    if (event.metadata?.resizedImage === 'true') return 'thumbnail'

    let current = await store.head(event.bucket, event.name)
    if (!current) return 'deleted'
    // A retry of the original event can finish after rotation committed, even if
    // the generated finalize event has not arrived. Other old generations stop.
    if (current.generation !== event.generation &&
        current.metadata?.[INPUT] !== event.generation) return 'stale'
    if (current.metadata?.resizedImage === 'true') return 'thumbnail'
    if (!current.contentType?.startsWith('image/')) return 'not-image'

    const destination = outputName(event.name)
    const existing = await store.head(event.bucket, destination)
    if (existing && existing.metadata?.resizedImage !== 'true') {
      throw new Error('Thumbnail path collides with a non-thumbnail object')
    }
    if (existing?.metadata?.[OWNER] && existing.metadata[OWNER] !== event.name) {
      throw new Error('Thumbnail path belongs to another source')
    }
    if (existing?.metadata?.[SOURCE] &&
        BigInt(existing.metadata[SOURCE]) >= BigInt(current.generation)) return 'complete'

    const input = await store.read(event.bucket, event.name, current.generation)
    // Preserve legacy truthy autoOrient behavior, including previously rotated objects.
    const orient = !current.metadata?.autoOrient
    const images = await processImage(input, orient, current)
    if (orient) {
      await store.write(event.bucket, event.name, images.original,
        metadataFor(current, { ...current.metadata, autoOrient: 'true', [INPUT]: current.generation }),
        current)
      const rotated = await store.head(event.bucket, event.name)
      if (!rotated || rotated.metadata?.[INPUT] !== current.generation) return 'superseded'
      current = rotated
    }

    // Read output BEFORE checking source: an output committed by a newer worker
    // makes this compare-and-swap fail rather than being overwritten by this worker.
    const previous = await store.head(event.bucket, destination)
    if (previous && previous.metadata?.resizedImage !== 'true') throw new Error('Thumbnail collision')
    if (previous?.metadata?.[OWNER] && previous.metadata[OWNER] !== event.name) throw new Error('Thumbnail owner changed')
    if (previous?.metadata?.[SOURCE] &&
        BigInt(previous.metadata[SOURCE]) >= BigInt(current.generation)) return 'complete'
    const latest = await store.head(event.bucket, event.name)
    if (!latest || latest.generation !== current.generation) return 'superseded'
    if (latest.metageneration !== current.metageneration) {
      // Metadata edits do not generate finalize events: retry this event instead
      // of relying on another event to preserve a newly issued download token.
      throw Object.assign(new Error('Source metadata changed; retry required'), { code: 412 })
    }

    const custom = { ...current.metadata, resizedImage: 'true',
      [SOURCE]: current.generation, [OWNER]: event.name }
    delete custom[INPUT]
    // Never copy an original download token to a derivative. Retain an existing
    // derivative's token so links already stored outside this client remain valid.
    delete custom.firebaseStorageDownloadTokens
    if (previous?.metadata?.firebaseStorageDownloadTokens) {
      custom.firebaseStorageDownloadTokens = previous.metadata.firebaseStorageDownloadTokens
    }
    await store.write(event.bucket, destination, images.thumbnail,
      metadataFor(current, custom), previous)
    return 'processed'
  }
}

module.exports = { createHandler, transform, outputName }
