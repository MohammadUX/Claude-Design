/**
 * Picks ONE accent colour from an image, the way the backend does for event banners:
 * the most-used vivid colour (blacks, whites and greys are ignored), tuned so it works
 * as a soft background gradient.
 */

export type RGB = [number, number, number]

/** Figma's default for the event detail gradient, used when nothing vivid is found. */
export const DEFAULT_ACCENT: RGB = [93, 88, 243]

const cache = new Map<string, RGB>()

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h /= 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255].map(Math.round) as RGB
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map((v) => Math.round(v * 255)) as RGB
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Pure part: pixels in, one colour out. */
export function pickAccent(data: Uint8ClampedArray): RGB {
  const BINS = 24 // 15° hue buckets
  const weight = new Array(BINS).fill(0)
  const sum = Array.from({ length: BINS }, () => [0, 0, 0])
  let pixels = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue
    pixels++
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const [h, s, l] = rgbToHsl(r, g, b)
    if (s < 0.25 || l < 0.15 || l > 0.88) continue // neutral: black, white, grey
    const bin = Math.floor(h * BINS) % BINS
    // Count how often the colour appears, favouring saturated mid-tones over muddy ones.
    const w = s * (1 - Math.abs(l - 0.5))
    weight[bin] += w
    sum[bin][0] += r * w
    sum[bin][1] += g * w
    sum[bin][2] += b * w
  }

  // Neighbouring hue buckets belong to the same colour family, so score each bucket with its neighbours.
  let best = -1
  let bestScore = 0
  for (let i = 0; i < BINS; i++) {
    const score = weight[i] + 0.5 * (weight[(i + 1) % BINS] + weight[(i + BINS - 1) % BINS])
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  }
  if (best < 0 || bestScore < pixels * 0.01) return DEFAULT_ACCENT

  const w = weight[best]
  const [h, s, l] = rgbToHsl(sum[best][0] / w, sum[best][1] / w, sum[best][2] / w)
  // Keep it rich but soft enough to sit behind dark text.
  return hslToRgb(h, clamp(s, 0.5, 0.88), clamp(l, 0.58, 0.66))
}

/** Loads the image, samples it on a small canvas and returns its accent colour. */
export function extractAccent(src: string): Promise<RGB> {
  const cached = cache.get(src)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 64
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(DEFAULT_ACCENT)
        ctx.drawImage(img, 0, 0, size, size)
        const accent = pickAccent(ctx.getImageData(0, 0, size, size).data)
        cache.set(src, accent)
        resolve(accent)
      } catch {
        resolve(DEFAULT_ACCENT)
      }
    }
    img.onerror = () => resolve(DEFAULT_ACCENT)
    img.src = src
  })
}
