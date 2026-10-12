// Client-side photo processing: decode (HEIC/JPEG/PNG, honoring EXIF orientation),
// downscale and re-encode as JPEG. Re-encoding through a canvas also strips EXIF (GPS, etc.).

export type ProcessedPhoto = { full: Blob; thumb: Blob }

const FULL = { maxEdge: 1600, quality: 0.82, maxBytes: 500_000 }
const THUMB = { maxEdge: 400, quality: 0.75, maxBytes: 60_000 }

export async function processPhoto(file: Blob): Promise<ProcessedPhoto> {
  const source = await decode(file)
  try {
    const [full, thumb] = await Promise.all([encode(source, FULL), encode(source, THUMB)])
    return { full, thumb }
  } finally {
    if ('close' in source) source.close()
  }
}

type Source = ImageBitmap | HTMLImageElement

async function decode(file: Blob): Promise<Source> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Fallback for formats createImageBitmap rejects; <img> applies EXIF orientation by default.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } catch {
      throw new Error('No se pudo leer la imagen. Prueba con otra foto.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

async function encode(
  source: Source,
  { maxEdge, quality, maxBytes }: { maxEdge: number; quality: number; maxBytes: number },
): Promise<Blob> {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  const scale = Math.min(1, maxEdge / Math.max(width, height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)

  // Step quality down until the file fits the budget (or quality gets too low to bother).
  let q = quality
  let blob = await toJpeg(canvas, q)
  while (blob.size > maxBytes && q > 0.5) {
    q -= 0.08
    blob = await toJpeg(canvas, q)
  }

  // Release the canvas memory right away (iOS Safari has a tight total canvas budget).
  canvas.width = canvas.height = 0
  return blob
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      'image/jpeg',
      quality,
    ),
  )
}
