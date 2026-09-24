import {
  AiMagicIcon,
  BicepsFlexedIcon,
  BitcoinIcon,
  BoltIcon,
  ChartIcon,
  CodepenIcon,
  GavelIcon,
  NanoTechnologyIcon,
  Wallet02Icon,
  WorkIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import brandupScale from '../assets/events/brandup-scale.jpg'
import creatorverseSpeaker from '../assets/events/creatorverse-speaker.jpg'
import ipcSpeaker from '../assets/events/ipc-speaker.jpg'
import thriveBorders from '../assets/events/thrive-borders.jpg'

export type Category = {
  id: string
  name: string
  eventCount: string
  icon: IconSvgElement
  color: string
}

export type EventItem = {
  id: string
  title: string
  date: string
  /** null = free */
  priceFrom: number | null
  attendees: number
  categoryId: string
  organizerId: string
  isLive?: boolean
  format: 'Virtual' | 'In person'
  /** Placeholder poster art until real banners are exported from Figma. */
  art: { from: string; to: string; ink: string; kicker: string }
  /** Real event poster. When set it replaces the placeholder art. */
  image?: string
  /** Created by the signed-in user in this prototype session. */
  hostedByMe?: boolean
}

/** Poster shown on the event detail page (from the Figma design). */
export const defaultPoster = creatorverseSpeaker

export type Organizer = {
  id: string
  name: string
  tagline: string
  color: string
}

export const categories: Category[] = [
  { id: 'technology', name: 'Technology', eventCount: '200 Events', icon: NanoTechnologyIcon, color: '#e5484d' },
  { id: 'investments', name: 'Investments', eventCount: '450 Events', icon: ChartIcon, color: '#f59e0b' },
  { id: 'legal', name: 'Legal', eventCount: '600 Events', icon: GavelIcon, color: '#7c3aed' },
  { id: 'engineering', name: 'Engineering', eventCount: '40 Events', icon: BoltIcon, color: '#2563eb' },
  { id: 'crypto', name: 'Crypto', eventCount: '220 Events', icon: BitcoinIcon, color: '#e5484d' },
  { id: 'ai', name: 'AI', eventCount: '850 Events', icon: AiMagicIcon, color: '#6d5bd0' },
  { id: 'art', name: 'Art and Design', eventCount: '350 Events', icon: CodepenIcon, color: '#e5484d' },
  { id: 'finance', name: 'Finance', eventCount: '520 Events', icon: Wallet02Icon, color: '#16a34a' },
  { id: 'business', name: 'Business', eventCount: '120 Events', icon: WorkIcon, color: '#d97706' },
  { id: 'fitness', name: 'Fitness', eventCount: '1.1K Events', icon: BicepsFlexedIcon, color: '#232828' },
]

export const organizers: Organizer[] = [
  { id: 'o1', name: 'Design Circle', tagline: 'hosting talks, meetups & masterclasses', color: '#f97316' },
  { id: 'o2', name: 'Fintech Forward', tagline: 'hosting talks, meetups & masterclasses', color: '#2563eb' },
  { id: 'o3', name: 'Founders Lab', tagline: 'hosting talks, meetups & masterclasses', color: '#232828' },
  { id: 'o4', name: 'Product People', tagline: 'hosting talks, meetups & masterclasses', color: '#16a34a' },
  { id: 'o5', name: 'Creative Hub', tagline: 'hosting talks, meetups & masterclasses', color: '#a16207' },
]

const art = {
  amber: { from: '#2a1f14', to: '#5b3a1a', ink: '#fbbf24', kicker: 'Successfully placed' },
  indigo: { from: '#3730a3', to: '#1e1b4b', ink: '#ffffff', kicker: 'Meet the speaker' },
  pink: { from: '#fdf2f8', to: '#f472b6', ink: '#831843', kicker: '#IPC2026 Speaker' },
  night: { from: '#111827', to: '#312e81', ink: '#a5b4fc', kicker: 'Thrive beyond borders' },
  violet: { from: '#4c1d95', to: '#1f1147', ink: '#ffffff', kicker: 'Speakers' },
  lime: { from: '#ecfccb', to: '#fde047', ink: '#1a2e05', kicker: 'For creative entrepreneurs' },
  lilac: { from: '#f5f3ff', to: '#a78bfa', ink: '#2e1065', kicker: 'Live session' },
  gold: { from: '#1e3a8a', to: '#facc15', ink: '#ffffff', kicker: 'Design. Build. Grow.' },
}

export const featuredEvents: EventItem[] = [
  { id: 'e1', title: 'Breaking into UX: Portfolio Clinic', date: 'Sat, Jul 4, 2026.  7.00 PM', format: 'In person', priceFrom: null, attendees: 852, categoryId: 'art', organizerId: 'o1', art: art.amber, image: creatorverseSpeaker },
  { id: 'e2', title: 'Creator Economy Masterclass', date: 'Sun, Jul 5, 2026.  4.00 PM', format: 'Virtual', priceFrom: null, attendees: 614, categoryId: 'business', organizerId: 'o5', art: art.indigo, image: creatorverseSpeaker },
  { id: 'e3', title: 'Product Leadership Summit', date: 'Fri, Jul 10, 2026.  10.00 AM', format: 'In person', priceFrom: 5, attendees: 1204, categoryId: 'technology', organizerId: 'o4', art: art.pink, image: ipcSpeaker },
  { id: 'e4', title: 'Thrive Beyond Borders', date: 'Tue, Jul 14, 2026.  6.30 PM', format: 'Virtual', priceFrom: 5, attendees: 852, categoryId: 'business', organizerId: 'o3', art: art.night, image: thriveBorders },
  { id: 'e5', title: 'Crypto Regulation Roundtable', date: 'Thu, Jul 16, 2026.  2.00 PM', format: 'In person', priceFrom: 12, attendees: 320, categoryId: 'crypto', organizerId: 'o2', art: art.gold, image: brandupScale },
  { id: 'e6', title: 'AI for Legal Teams', date: 'Mon, Jul 20, 2026.  11.00 AM', format: 'Virtual', priceFrom: 20, attendees: 488, categoryId: 'legal', organizerId: 'o3', art: art.violet, image: ipcSpeaker },
  { id: 'e7', title: 'Morning HIIT in the Park', date: 'Sat, Jul 25, 2026.  7.00 AM', format: 'In person', priceFrom: null, attendees: 96, categoryId: 'fitness', organizerId: 'o5', art: art.lime, image: thriveBorders },
  { id: 'e8', title: 'Personal Finance 101', date: 'Wed, Jul 29, 2026.  5.00 PM', format: 'Virtual', priceFrom: null, attendees: 740, categoryId: 'finance', organizerId: 'o2', art: art.lilac, image: brandupScale },
]

export const liveEvents: EventItem[] = [
  { id: 'l1', title: 'Minister Speaks: Future of Tech', date: 'Live now  ·  Started 7.00 PM', format: 'Virtual', priceFrom: null, attendees: 852, categoryId: 'technology', organizerId: 'o3', isLive: true, art: art.violet, image: thriveBorders },
  { id: 'l2', title: 'Business Intelligence for Creatives', date: 'Live now  ·  Started 6.30 PM', format: 'In person', priceFrom: 5, attendees: 1320, categoryId: 'business', organizerId: 'o5', isLive: true, art: art.lime, image: brandupScale },
  { id: 'l3', title: 'Building Apps with AI Agents', date: 'Live now  ·  Started 6.00 PM', format: 'Virtual', priceFrom: 5, attendees: 977, categoryId: 'ai', organizerId: 'o4', isLive: true, art: art.lilac, image: ipcSpeaker },
  { id: 'l4', title: 'Scale: Design. Build. Grow.', date: 'Live now  ·  Started 5.45 PM', format: 'In person', priceFrom: 5, attendees: 2104, categoryId: 'engineering', organizerId: 'o1', isLive: true, art: art.gold, image: brandupScale },
  { id: 'l5', title: 'Investing in Emerging Markets', date: 'Live now  ·  Started 5.30 PM', format: 'Virtual', priceFrom: 10, attendees: 431, categoryId: 'investments', organizerId: 'o2', isLive: true, art: art.night, image: creatorverseSpeaker },
  { id: 'l6', title: 'Breaking into UX: Portfolio Clinic', date: 'Live now  ·  Started 5.00 PM', format: 'Virtual', priceFrom: null, attendees: 852, categoryId: 'art', organizerId: 'o1', isLive: true, art: art.amber, image: creatorverseSpeaker },
]

export const allEvents = [...featuredEvents, ...liveEvents]

export const attendeeColors = ['#b45309', '#475569', '#1f2937']

export function formatPrice(priceFrom: number | null) {
  return priceFrom === null ? 'Free' : `From $${priceFrom.toFixed(2)}`
}
