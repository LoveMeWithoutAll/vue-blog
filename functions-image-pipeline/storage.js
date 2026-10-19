function createStore (storage) {
  return {
    async head (bucket, name) {
      try {
        const [metadata] = await storage.bucket(bucket).file(name).getMetadata()
        return metadata
      } catch (error) {
        if (Number(error.code) === 404) return null
        throw error
      }
    },
    async read (bucket, name, generation) {
      const [data] = await storage.bucket(bucket).file(name, { generation }).download()
      return data
    },
    async write (bucket, name, data, metadata, previous) {
      await storage.bucket(bucket).file(name).save(data, {
        resumable: false,
        validation: 'crc32c',
        metadata,
        preconditionOpts: {
          ifGenerationMatch: previous ? previous.generation : 0,
          ...(previous ? { ifMetagenerationMatch: previous.metageneration } : {})
        }
      })
    }
  }
}

module.exports = { createStore }
