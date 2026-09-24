import { allEvents, categories, type EventItem } from './mock'

export type Person = {
  id: string
  name: string
  role: string
  color: string
  verified?: boolean
  /** Not on PAAQ yet, so the row offers "Invite to PAAQ" instead of "Follow". */
  onPaaq?: boolean
}

export type SponsorTier = 'gold' | 'silver' | 'help'

export type Sponsor = { id: string; name: string; tier: SponsorTier; color: string; website?: string }

export type EventDetail = {
  event: EventItem
  host: Person
  when: { month: string; day: string; longDate: string; time: string }
  location: { label: string; hostedIn: string }
  speakers: Person[]
  about: { intro: string; points: string[]; tags: string[] }
  attending: { count: number; people: Person[] }
  sponsors: Sponsor[]
}

const weekdays: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

/** Card dates look like "Sat, Jul 4, 2026.  7.00 PM"; live events show "Live now · Started 7.00 PM". */
function parseWhen(event: EventItem): EventDetail['when'] {
  const m = event.date.match(/^(\w{3}), (\w{3}) (\d{1,2}), (\d{4})\.\s+(\d{1,2})\.(\d{2}) ([AP]M)$/)
  if (m) {
    const [, wd, mon, day, year, h, min, ap] = m
    return {
      month: mon,
      day,
      longDate: `${weekdays[wd]}, ${day} ${mon} ${year}`,
      time: `${h}:${min} ${ap} West Africa Time`,
    }
  }
  const started = event.date.match(/Started (\d{1,2})\.(\d{2}) ([AP]M)/)
  return {
    month: 'Sep',
    day: '24',
    longDate: 'Today, Thursday 24 Sep 2026',
    time: started ? `Started ${started[1]}:${started[2]} ${started[3]} West Africa Time` : 'Happening now',
  }
}

const people: Person[] = [
  { id: 'p1', name: 'Juma Omondi', role: 'Investment expert', color: '#7c5a3a', verified: true, onPaaq: true },
  { id: 'p2', name: 'Sadia Noor', role: 'Founder, Brightpath', color: '#9d4b6b', verified: true, onPaaq: true },
  { id: 'p3', name: 'Tunde Bakare', role: 'Product leader', color: '#2f3535', onPaaq: false },
  { id: 'p4', name: 'Amara Eze', role: 'People & culture lead', color: '#4b6b9d', verified: true, onPaaq: true },
  { id: 'p5', name: 'Kofi Mensah', role: 'Operator in residence', color: '#3a7c6a', onPaaq: false },
]

const attendees: Person[] = [
  'Chidi Okafor', 'Lerato Dlamini', 'Musa Abubakar', 'Zainab Bello', 'Kwame Asante', 'Nia Wanjiru',
  'Emeka Obi', 'Fatima Sow', 'Yaw Boateng', 'Aisha Kamara', 'David Mwangi', 'Grace Achieng',
].map((name, i) => ({
  id: `a${i}`,
  name,
  role: ['Founder', 'Designer', 'Engineer', 'Investor', 'Student', 'Marketer'][i % 6],
  color: ['#7c5a3a', '#475569', '#9d4b6b', '#1f2937', '#3a7c6a', '#6d5bd0'][i % 6],
}))

const sponsors: Sponsor[] = [
  { id: 's1', name: 'Design Circle', tier: 'gold', color: '#f97316', website: 'designcircle.africa' },
  { id: 's2', name: 'Fintech Forward', tier: 'silver', color: '#2563eb' },
  { id: 's3', name: 'Product People', tier: 'help', color: '#1a2e05' },
  { id: 's4', name: 'Founders Lab', tier: 'help', color: '#232828' },
  { id: 's5', name: 'Creative Hub', tier: 'help', color: '#a16207' },
]

export function getEventDetail(eventId: string | undefined): EventDetail | null {
  const event = allEvents.find((e) => e.id === eventId)
  if (!event) return null
  const category = categories.find((c) => c.id === event.categoryId)
  return {
    event,
    host: people[0],
    when: parseWhen(event),
    location: { label: 'Virtual event', hostedIn: 'PAAQ' },
    speakers: [people[0], people[1], people[2], people[3], people[4]],
    about: {
      intro:
        'Growing a business is exciting, but it can also wear you down fast. In this 90-minute session, Sadia Noor shares practical ways to grow your startup while protecting your energy and your team. You will leave with simple steps you can use the very next day.',
      points: [
        'How to spot the tasks that are quietly draining you',
        'A simple weekly rhythm that keeps you focused',
        'When to hire, and when to wait',
        'How to keep your team motivated during fast growth',
      ],
      tags: ['Startup', category?.name ?? 'Business', 'Growth'],
    },
    attending: { count: event.attendees, people: attendees },
    sponsors,
  }
}
