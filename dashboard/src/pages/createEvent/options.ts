import { LiveStreaming02Icon, Mortarboard01Icon, Presentation01Icon, Video02Icon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type { EventType, Tier } from './model'

export const eventTypes: { type: EventType; hint: string; icon: IconSvgElement; tint: string }[] = [
  { type: 'Training', hint: 'Hands-on, practical skill-building', icon: Mortarboard01Icon, tint: '#e9eeee' },
  { type: 'Masterclass', hint: 'An expert teaches many; deeper learning', icon: Presentation01Icon, tint: '#eef0f5' },
  { type: 'Webinar', hint: 'Online talk to an audience, with Q&A', icon: Video02Icon, tint: '#eeedfb' },
  { type: 'Live event', hint: 'Real-time gathering, like a conference or meetup', icon: LiveStreaming02Icon, tint: '#fbeeee' },
]

export type Expert = { id: string; name: string; title: string; rating: number; spokeBefore?: boolean; color: string }

/** PAAQ experts the host can invite as speakers. */
export const experts: Expert[] = [
  { id: 'x1', name: 'Juma Omondi', title: 'Finance and investment expert', rating: 4.9, spokeBefore: true, color: '#7c5a3a' },
  { id: 'x2', name: 'Sadia Noor', title: 'Founder, Brightpath', rating: 4.8, spokeBefore: true, color: '#9d4b6b' },
  { id: 'x3', name: 'Amara Eze', title: 'People & culture lead', rating: 4.8, color: '#4b6b9d' },
  { id: 'x4', name: 'Tobi Adeyemi', title: 'Product Designer at Google', rating: 4.7, color: '#1f2937' },
  { id: 'x5', name: 'Wanjiku Kamau', title: 'Head of Growth, Pesa', rating: 4.7, color: '#3a7c6a' },
  { id: 'x6', name: 'Kojo Mensah', title: 'Engineering manager', rating: 4.6, color: '#6d5bd0' },
  { id: 'x7', name: 'Lerato Dlamini', title: 'Brand strategist', rating: 4.6, color: '#b45309' },
]

/** PAAQ members the host can invite to the event team. */
export const members = [
  { name: 'Juma Omondi', email: 'juma@paaq.co', verified: true },
  { name: 'Arthur Taylor', email: 'arthur@alignui.com', verified: true },
  { name: 'Laura Perez', email: 'laura@alignui.com' },
  { name: 'Halima Yusuf', email: 'halima@paaq.co', verified: true },
  { name: 'Sipho Nkosi', email: 'sipho@studio.africa' },
  { name: 'Ifeoma Nwosu', email: 'ifeoma@paaq.co', verified: true },
]

export const sponsorLibrary = [
  { name: 'Oripio', website: 'www.oripio.com', email: 'info@oripio.com', color: '#f97316' },
  { name: 'Fintech Forward', website: 'www.fintechforward.io', email: 'hello@fintechforward.io', color: '#2563eb' },
  { name: 'Frame Studio', website: 'www.framestudio.co', email: 'team@framestudio.co', color: '#111827' },
  { name: 'Product People', website: 'www.productpeople.africa', email: 'hi@productpeople.africa', color: '#1a2e05' },
]

export const venues = [
  'Landmark Event Centre, Victoria Island, Lagos',
  'The Zone Tech Park, Gbagada, Lagos',
  'Civic Centre, Ozumba Mbadiwe, Lagos',
  'Co-Creation Hub, Yaba, Lagos',
  'Radisson Blu Anchorage, Victoria Island, Lagos',
  'Eko Hotel & Suites, Victoria Island, Lagos',
  'The Mall of Africa, Midrand, Johannesburg',
  'iHub, Nairobi',
]

export const tierOptions: { value: Tier; label: string }[] = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'help', label: 'Help' },
]
