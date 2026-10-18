const { onObjectFinalized } = require('firebase-functions/v2/storage')
const { requiresRole, requiresAPI } = require('firebase-functions/v2')
const { defineString, defineInt } = require('firebase-functions/params')
const { Storage } = require('@google-cloud/storage')
const logger = require('firebase-functions/logger')
const { createHandler } = require('./pipeline')
const { createStore } = require('./storage')

// Declarations are applied only by an explicitly approved deployment.
requiresAPI('storage.googleapis.com', 'Read source images and write oriented originals and thumbnails')
requiresRole('roles/storage.objectUser')

// No production defaults: the bucket's actual location must be verified first.
const bucket = defineString('IMAGE_BUCKET')
const region = defineString('IMAGE_REGION')
const maxInstances = defineInt('IMAGE_MAX_INSTANCES')
let handler

exports.processBlogImage = onObjectFinalized({
  bucket,
  region,
  memory: '1GiB',
  cpu: 'gcf_gen1',
  concurrency: 1,
  maxInstances,
  timeoutSeconds: 120,
  retry: true
}, async (event) => {
  handler ||= createHandler(createStore(new Storage()))
  const outcome = await handler(event.data)
  logger.info('Image pipeline event completed', { eventId: event.id, outcome })
  return outcome
})
