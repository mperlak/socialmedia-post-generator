/**
 * File utility functions for converting files to base64
 * Used for uploading files to AI API
 */

export interface FileData {
  name: string
  type: string
  data: string // base64 encoded
}

/**
 * Convert FileData to data URL format for AI SDK
 * Returns: "data:application/pdf;base64,JVBERi0xLj..."
 */
export function fileDataToDataURL(file: FileData): string {
  return `data:${file.type};base64,${file.data}`
}

/**
 * Create a small thumbnail for preview (max 400px, quality 0.5)
 * Returns data URL for sessionStorage
 */
export async function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read image'))
        return
      }

      img.onload = () => {
        // Calculate new dimensions (max 400px, maintain aspect ratio)
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height
            height = MAX_SIZE
          }
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to data URL with low quality (0.5)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
        resolve(dataUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image file using Canvas API
 * Reduces dimensions to max 1400px (optimal for AI analysis) and compresses to JPEG
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read image'))
        return
      }

      img.onload = () => {
        // Calculate new dimensions (max 1400px, maintain aspect ratio)
        // Optimal size for Claude AI vision analysis (1200-1400px recommended)
        const MAX_WIDTH = 1400
        const MAX_HEIGHT = 1400
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width
          width = MAX_WIDTH
        }

        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height
          height = MAX_HEIGHT
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression (0.7 quality for JPEG - optimal for AI)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Create new File from blob
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          0.7
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Convert a single File to base64 encoded string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('Failed to read file as string'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Convert a File to FileData object with metadata
 * Automatically compresses images before conversion
 */
export async function fileToFileData(file: File): Promise<FileData> {
  let processedFile = file

  // Compress images before conversion
  const imageTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (imageTypes.includes(file.type)) {
    try {
      processedFile = await compressImage(file)
      console.log(`Compressed ${file.name}: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`)
    } catch (error) {
      console.warn('Failed to compress image, using original:', error)
      processedFile = file
    }
  }

  const data = await fileToBase64(processedFile)

  return {
    name: processedFile.name,
    type: processedFile.type,
    data
  }
}

/**
 * Convert multiple Files to FileData objects
 */
export async function filesToFileData(files: File[]): Promise<FileData[]> {
  return Promise.all(files.map(file => fileToFileData(file)))
}

/**
 * Validate PDF file
 */
export function validatePdf(file: File): { valid: boolean; error?: string } {
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Plik musi być w formacie PDF' }
  }

  // Max 10MB
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'Plik PDF nie może być większy niż 10MB' }
  }

  return { valid: true }
}

/**
 * Validate image files
 */
export function validateImages(files: File[]): { valid: boolean; error?: string } {
  if (files.length < 3) {
    return { valid: false, error: 'Musisz dodać minimum 3 zdjęcia' }
  }

  if (files.length > 10) {
    return { valid: false, error: 'Możesz dodać maksymalnie 10 zdjęć' }
  }

  // Check if all files are images
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  const invalidFiles = files.filter(file => !validTypes.includes(file.type))

  if (invalidFiles.length > 0) {
    return { valid: false, error: 'Wszystkie pliki muszą być w formacie JPG lub PNG' }
  }

  // Max 5MB per image
  const maxSize = 5 * 1024 * 1024
  const tooLargeFiles = files.filter(file => file.size > maxSize)

  if (tooLargeFiles.length > 0) {
    return { valid: false, error: 'Każde zdjęcie nie może być większe niż 5MB' }
  }

  return { valid: true }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
