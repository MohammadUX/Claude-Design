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

/** A person on the event team (Participants tab). */
export type TeamMember = Person & { teamRole: 'Host' | 'Admin' | 'Moderator' }

export type Channel = {
  name: string
  description: string
  members: string
  color: string
  /** Public channels can be joined straight away; private ones need a join request. */
  visibility: 'Public' | 'Private'
}

export type Engagement =
  | { id: string; at: string; kind: 'qa'; question: string; askedBy: string | null; tag: string; likes: number }
  | { id: string; at: string; kind: 'poll'; question: string; options: { label: string; votes: number }[] }
  | { id: string; at: string; kind: 'wordcloud'; prompt: string; by: Person; words: { text: string; weight: number }[] }
  | { id: string; at: string; kind: 'announcement'; message: string; by: Person }

export type EventDetail = {
  event: EventItem
  host: Person
  team: TeamMember[]
  channel: Channel
  engagements: Engagement[]
  resources: {
    summaryTitle: string
    summary: string[]
    howItHelps: string
    checklist: string[]
    bookingSuggestions: Person[]
    aiMatches: Person[]
  }
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
  'Tobi Adeyemi', 'Sipho Nkosi', 'Halima Yusuf', 'Kojo Mensah', 'Wanjiku Kamau', 'Ifeoma Nwosu',
].map((name, i) => ({
  id: `a${i}`,
  name,
  role: ['Product Designer', 'Teacher', 'Investment expert', 'Engineer', 'Founder', 'Marketer'][i % 6],
  color: ['#7c5a3a', '#475569', '#9d4b6b', '#1f2937', '#3a7c6a', '#6d5bd0'][i % 6],
  verified: i % 3 !== 1,
  // A few guests signed up by email only and aren't on PAAQ yet.
  onPaaq: i % 7 !== 6 && i < 14,
}))

const team: TeamMember[] = [
  { ...people[0], teamRole: 'Host' },
  { id: 't2', name: 'Amara Eze', role: 'Community manager', color: '#4b6b9d', verified: true, onPaaq: true, teamRole: 'Admin' },
  { id: 't3', name: 'Kofi Mensah', role: 'Operator in residence', color: '#3a7c6a', verified: true, onPaaq: true, teamRole: 'Moderator' },
]

const channels: Channel[] = [
  { name: 'Xero Fitness', description: 'High intensity training tips and weekly workout drops, form checks, and motivation.', members: '1.2k', color: '#1a2e05', visibility: 'Public' },
  { name: 'Founders Circle', description: 'A private room for founders to swap playbooks, hiring notes and investor intros.', members: '486', color: '#312e81', visibility: 'Private' },
]

function engagementsFor(host: Person): Engagement[] {
  return [
    { id: 'g1', at: '4.02 min', kind: 'qa', question: 'How do you keep your team motivated when money is tight?', askedBy: null, tag: '@Speaker', likes: 77 },
    {
      id: 'g2',
      at: '12.40 min',
      kind: 'poll',
      question: 'In one word, what drains your energy most?',
      options: [
        { label: 'Meetings', votes: 43 },
        { label: 'Email', votes: 12 },
        { label: 'Payroll', votes: 3 },
        { label: 'Hiring', votes: 2 },
      ],
    },
    {
      id: 'g3',
      at: '27.15 min',
      kind: 'wordcloud',
      prompt: 'Describe your ideal work week in one word.',
      by: host,
      words: [
        { text: 'Focus', weight: 5 },
        { text: 'Calm', weight: 4 },
        { text: 'Deep work', weight: 3 },
        { text: 'Balance', weight: 3 },
        { text: 'Shipping', weight: 2 },
        { text: 'Rest', weight: 2 },
        { text: 'Momentum', weight: 1 },
        { text: 'Family', weight: 1 },
      ],
    },
    { id: 'g4', at: '48.30 min', kind: 'announcement', message: 'Slides and the weekly planner template are now in Resources.', by: host },
  ]
}

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
    team,
    // Odd-numbered events belong to a private community, so attendees request to join.
    channel: channels[Number(event.id.replace(/\D/g, '')) % 2 === 0 ? 1 : 0],
    engagements: engagementsFor(people[0]),
    resources: {
      summaryTitle: 'Session summary',
      summary: [
        'Sadia walked through how early teams burn out: too many priorities, unclear ownership and no recovery time between launches.',
        'The fix is a simple operating rhythm: one focus per week, protected deep-work blocks, and a Friday review that decides what to drop.',
      ],
      howItHelps:
        'Use the weekly rhythm to plan your own work, and share the hiring checklist with your co-founder before your next role opens.',
      checklist: [
        'List the three tasks that drained you most last week',
        'Block two 90-minute focus sessions in your calendar',
        'Set up a 20-minute Friday review',
        'Decide one thing to stop doing this month',
        'Share the planner template with your team',
      ],
      bookingSuggestions: [people[1], people[3], team[2]],
      aiMatches: attendees.slice(0, 3),
    },
    when: parseWhen(event),
    location: event.format === 'Virtual' ? { label: 'Virtual event', hostedIn: 'PAAQ' } : { label: 'In person', hostedIn: 'Landmark Event Centre, Lagos' },
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
