export interface UploadTarget {
  uploadUrl: string
  objectKey: string
}

/** Cloud Storage with signed URLs sits behind this interface (host space photos). */
export interface StorageService {
  requestUploadUrl(input: { filename: string; contentType: string }): Promise<UploadTarget>
  upload(file: Blob, target: UploadTarget): Promise<void>
}

export function createMockStorageService(): StorageService {
  return {
    async requestUploadUrl({ filename }) {
      const objectKey = `mock/${Date.now()}-${filename}`
      return { uploadUrl: `https://storage.example.invalid/${objectKey}`, objectKey }
    },
    async upload() {
      // Nothing leaves the browser in mock mode.
    },
  }
}
