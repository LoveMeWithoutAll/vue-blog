const functions = require('firebase-functions')
const mkdirp = require('mkdirp-promise')
const { Storage } = require('@google-cloud/storage')
const spawn = require('child-process-promise').spawn
const path = require('path')
const os = require('os')
const fs = require('fs')
const storage = new Storage()

exports.rotateUsingExif = functions.storage.object().onFinalize((object) => {
  const filePath = object.name
  const bucketName = object.bucket
  const metadata = object.metadata

  const tempLocalFile = path.join(os.tmpdir(), filePath)
  const tempLocalDir = path.dirname(tempLocalFile)
  const bucket = storage.bucket(bucketName)

  if (!object.contentType.startsWith('image/')) {
    console.log('This is not an image.')
    return null
  }

  if (metadata.autoOrient) {
    console.log('This is already rotated')
    return null
  }
  
  return mkdirp(tempLocalDir).then(() => {
    // Download file from bucket.
    return bucket.file(filePath).download({destination: tempLocalFile})
  }).then(() => {
    console.log('The file has been downloaded to', tempLocalFile)
    // Convert the image using ImageMagick.
    return spawn('convert', [tempLocalFile, '-auto-orient', tempLocalFile])
  }).then(() => {
    console.log('rotated image created at', tempLocalFile)
    metadata.autoOrient = true
    return bucket.upload(tempLocalFile, {
      destination: filePath,
      metadata: {metadata: metadata}
    })
  }).then(() => {
    console.log('image uploaded to Storage at', filePath)
    // Once the image has been converted delete the local files to free up disk space.
    fs.unlinkSync(tempLocalFile)
    return console.log('Deleted local file', filePath)
  })
})
