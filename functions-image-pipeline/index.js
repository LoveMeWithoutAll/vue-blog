const { onObjectFinalized } = require('firebase-functions/v2/storage')
const { onInit } = require('firebase-functions/v2/core')
const process = require('node:process')
const { defineString, defineInt } = require('firebase-functions/params')
const { Storage } = require('@google-cloud/storage')
const logger = require('firebase-functions/logger')
const { createHandler } = require('./pipeline')
const { createStore } = require('./storage')

// No production defaults: the bucket's actual location must be verified first.
const bucket = defineString('IMAGE_BUCKET')
const region = defineString('IMAGE_REGION')
const maxInstances = defineInt('IMAGE_MAX_INSTANCES')
// Provision separately with bucket-scoped IAM; Firebase declarative IAM grants
// project-wide roles and must not be used for this codebase.
const serviceAccount = defineString('IMAGE_SERVICE_ACCOUNT')
const paused = defineString('IMAGE_PROCESSING_PAUSED', { default: 'true' })
let handler

const runtimeVerification = process.env.K_SERVICE && process.env.VERIFY_NATIVE_RUNTIME === 'true'
  ? require('./runtime-check').verifyNativeRuntime().then(result => {
    logger.info('Native runtime verification passed', result)
    return true
  }).catch(() => {
    logger.error('Native runtime verification failed')
    return false
  })
  : Promise.resolve(true)

onInit(async () => {
  if (!await runtimeVerification) throw new Error('Native runtime verification failed')
})

exports.processBlogImage = onObjectFinalized({
  bucket,
  region,
  serviceAccount,
  memory: '1GiB',
  cpu: 'gcf_gen1',
  concurrency: 1,
  maxInstances,
  timeoutSeconds: 120,
  retry: true
}, async (event) => {
  if (paused.value() !== 'false') {
    logger.info('Image processing paused; existing handlers retain ownership', { eventId: event.id })
    return 'paused'
  }
  handler ||= createHandler(createStore(new Storage()))
  const outcome = await handler(event.data)
  logger.info('Image pipeline event completed', { eventId: event.id, outcome })
  return outcome
})
