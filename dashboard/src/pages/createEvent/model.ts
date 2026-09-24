export type EventType = 'Training' | 'Masterclass' | 'Webinar' | 'Live event'
export type Visibility = 'Public' | 'Private'
export type GuestRole = 'Admin' | 'Moderator' | 'Guest'
export type Tier = 'gold' | 'silver' | 'help'

export type Speaker = {
  id: string
  name: string
  title: string
  email?: string
  about?: string
  photo?: string
  color: string
  /** Found on PAAQ (can answer questions) vs. a manually created backup profile. */
  source: 'paaq' | 'backup'
  verified?: boolean
}

export type Guest = { id: string; name: string; email: string; role: GuestRole; color: string; verified?: boolean }

export type SponsorEntry = { id: string; name: string; website: string; email?: string; tier: Tier; logo?: string; color: string }

export type Ticket = {
  id: string
  name: string
  qty: number
  kind: 'Single' | 'Group'
  groupSize: number
  paid: boolean
  price: number
  discountPrice?: number
  description: string
  color: string
}

export type Draft = {
  type: EventType | null
  visibility: Visibility
  title: string
  poster: string | null
  timezone: string
  start: { date: string; minutes: number }
  end: { date: string; minutes: number }
  descriptionHtml: string
  tags: string[]
  format: 'In person' | 'Virtual'
  venue: string
  virtualMode: 'paaq' | 'other'
  externalLink: string
  speakers: Speaker[]
  guests: Guest[]
  sponsors: SponsorEntry[]
  tickets: Ticket[]
  plusPlan: boolean
  limitSales: boolean
  salesStart: string
  salesEnd: string
  limitQty: boolean
  maxPerPerson: number
  settings: {
    connectWindow: '7d' | '30d' | '90d'
    questionModeration: boolean
    attendeePhotos: boolean
    reminderEmails: boolean
    recap: boolean
  }
}

export const timezones = [
  { id: 'Africa/Lagos', city: 'Lagos, Nigeria', offset: 'GMT+1', long: 'West Africa Time' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg, South Africa', offset: 'GMT+2', long: 'South Africa Time' },
  { id: 'Africa/Gaborone', city: 'Gaborone, Botswana', offset: 'GMT+2', long: 'Central Africa Time' },
  { id: 'Africa/Nairobi', city: 'Nairobi, Kenya', offset: 'GMT+3', long: 'East Africa Time' },
  { id: 'Africa/Accra', city: 'Accra, Ghana', offset: 'GMT+0', long: 'Greenwich Mean Time' },
  { id: 'Africa/Cairo', city: 'Cairo, Egypt', offset: 'GMT+2', long: 'Eastern European Time' },
]

export const palette = ['#7c5a3a', '#475569', '#9d4b6b', '#1f2937', '#3a7c6a', '#6d5bd0', '#b45309', '#2563eb']
export const pickColor = (seed: string) => palette[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]
export const uid = () => Math.random().toString(36).slice(2, 9)

/** Prototype "today" (the session date). */
export const TODAY = '2026-09-24'

export function emptyDraft(): Draft {
  return {
    type: null,
    visibility: 'Public',
    title: '',
    poster: null,
    timezone: 'Africa/Lagos',
    start: { date: '2026-10-03', minutes: 10 * 60 },
    end: { date: '2026-10-03', minutes: 12 * 60 },
    descriptionHtml: '',
    tags: [],
    format: 'Virtual',
    venue: '',
    virtualMode: 'paaq',
    externalLink: '',
    speakers: [],
    guests: [],
    sponsors: [],
    tickets: [],
    plusPlan: false,
    limitSales: false,
    salesStart: TODAY,
    salesEnd: '2026-10-02',
    limitQty: false,
    maxPerPerson: 4,
    settings: { connectWindow: '7d', questionModeration: true, attendeePhotos: true, reminderEmails: true, recap: true },
  }
}

/** The draft survives leaving the page, so "Saved as draft" is true for the session. */
let saved: Draft | null = null
export const loadDraft = () => saved
export const saveDraft = (d: Draft | null) => {
  saved = d
}

export function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'my-event'
  )
}

export function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Splits rich-text into a lead paragraph and bullet points, as the event page shows them. */
export function htmlToAbout(html: string) {
  // Keep a space between blocks so "Heading" + "Paragraph" don't run together.
  const doc = new DOMParser().parseFromString(html.replace(/<\/(h\d|p|div|li)>/gi, '$& ').replace(/<br\s*\/?>/gi, ' '), 'text/html')
  const points = [...doc.querySelectorAll('li')].map((li) => li.textContent?.trim() ?? '').filter(Boolean)
  doc.querySelectorAll('ul, ol').forEach((el) => el.remove())
  const intro = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
  return { intro, points }
}

/** Reads a chosen image file into a data URL (works inside the shared artifact, unlike blob links). */
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
