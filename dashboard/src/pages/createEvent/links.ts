import { slugify } from './model'

/** Stable short code from the title, e.g. "PAAQ-9F3K2". */
function code(seed: string) {
  let h = 5381
  for (const c of seed || 'event') h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return h.toString(36).toUpperCase().slice(0, 5).padEnd(5, 'X')
}

export function paaqLink(title: string) {
  const c = code(title)
  return { url: `paaq.co/e/${slugify(title)}-${c}`, code: `PAAQ-${c}` }
}

const platforms = [
  { test: /meet\.google\.com/i, name: 'Google Meet', color: '#188038' },
  { test: /zoom\.us/i, name: 'Zoom', color: '#2d8cff' },
  { test: /teams\.(microsoft|live)\.com/i, name: 'Teams', color: '#5b5fc7' },
  { test: /youtu(\.be|be\.com)/i, name: 'YouTube', color: '#e62117' },
  { test: /(twitter|x)\.com\/i\/spaces/i, name: 'X Spaces', color: '#111827' },
]

/** "Auto detected platform": names the service from the pasted link. */
export function detectPlatform(link: string) {
  if (!link.trim()) return null
  return platforms.find((p) => p.test.test(link)) ?? { name: 'Custom link', color: '#4a5151' }
}

export const isUrl = (s: string) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(s.trim())
