// Client-side image compression. Cocktail photos coming from phones can be
// 5-10 MB; they get rendered at most 800px wide in the UI, so we downscale
// to 1600px (retina 2x) and re-encode as JPEG at 0.82 quality. Typical
// output is 150-500 KB with no visible quality loss.

const DEFAULT_MAX_EDGE = 1600
const DEFAULT_QUALITY = 0.82

type CompressOptions = {
  maxEdge?: number
  quality?: number
  /** Output mime type. 'image/jpeg' is the safest for photos — smallest
   *  files + widest support. Use 'image/webp' for better ratio if the
   *  browser supports it. */
  mime?: 'image/jpeg' | 'image/webp'
}

// Load a File into an HTMLImageElement so we can draw it on a canvas.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode image'))
    }
    img.src = url
  })
}

function canvasToDataUrl(canvas: HTMLCanvasElement, mime: string, quality: number): string {
  return canvas.toDataURL(mime, quality)
}

// Resize the canvas so the longer edge is at most `maxEdge`. If the source is
// already smaller, returns the source untouched (still re-encodes though —
// the user might have uploaded a 200KB PNG screenshot that's 300KB and needs
// JPEG conversion to shrink).
export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE
  const quality = options.quality ?? DEFAULT_QUALITY
  const mime = options.mime ?? 'image/jpeg'

  // Very small files: skip work, return as data URL untouched. Below 300KB
  // the compression/canvas overhead isn't worth it.
  if (file.size < 300 * 1024) {
    const dataUrl = await fileToDataUrl(file)
    return { dataUrl, sizeKb: Math.round(file.size / 1024), width: 0, height: 0 }
  }

  const img = await loadImage(file)
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight

  // Compute target dimensions keeping aspect ratio.
  let w = srcW
  let h = srcH
  if (Math.max(srcW, srcH) > maxEdge) {
    if (srcW >= srcH) {
      w = maxEdge
      h = Math.round((srcH * maxEdge) / srcW)
    } else {
      h = maxEdge
      w = Math.round((srcW * maxEdge) / srcH)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  // White background for JPEG, which doesn't support transparency.
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)

  const dataUrl = canvasToDataUrl(canvas, mime, quality)
  // Approx size: data URL length * 3/4 gives the byte count (minus header).
  const sizeKb = Math.round((dataUrl.length * 0.75) / 1024)

  return { dataUrl, sizeKb, width: w, height: h }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}
