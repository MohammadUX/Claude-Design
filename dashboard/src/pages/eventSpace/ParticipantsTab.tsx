import { useState, type ReactNode } from 'react'
import { FollowButton, InviteButton, RequestChatButton } from '../../components/event/PersonActions'
import PersonRow from '../../components/event/PersonRow'
import type { EventDetail, Person } from '../../data/eventDetail'
import SearchWithFilter from './SearchWithFilter'

type Group = 'all' | 'team' | 'speakers' | 'attendees'

const filterOptions: { value: Group; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'team', label: 'Hosts' },
  { value: 'speakers', label: 'Speakers' },
  { value: 'attendees', label: 'Attendees' },
]

const me: Person = { id: 'me', name: 'Ada Obi', role: 'Product Designer', color: '#b45309', verified: true, onPaaq: true }

function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' }) {
  return (
    <span
      className={`ml-1 rounded-full border px-3 py-1 text-xs leading-[1.2] font-medium ${
        tone === 'brand' ? 'border-brand-100 bg-brand-100 text-brand-700' : 'border-ink-200 bg-ink-100 text-ink-900'
      }`}
    >
      {children}
    </span>
  )
}

function ListCard({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base leading-[1.2] font-semibold text-ink-800">
        {title}
        {count !== undefined && <span className="ml-1.5 font-medium text-ink-600">{count.toLocaleString()}</span>}
      </h2>
      <div className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">{children}</div>
    </section>
  )
}

export default function ParticipantsTab({ detail, goingCount, onToast }: { detail: EventDetail; goingCount: number; onToast: (m: string) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<Group>('all')
  const [showAll, setShowAll] = useState(false)

  const q = query.trim().toLowerCase()
  const match = (p: Person) => !q || `${p.name} ${p.role}`.toLowerCase().includes(q)

  const team = detail.team.filter(match)
  const speakers = detail.speakers.filter(match)
  const everyone = [me, ...detail.attending.people].filter(match)
  const attendees = showAll || q ? everyone : everyone.slice(0, 9)

  const show = (g: Group) => group === 'all' || group === g
  const nothing = (show('team') ? team.length : 0) + (show('speakers') ? speakers.length : 0) + (show('attendees') ? everyone.length : 0) === 0

  const followAction = (p: Person) =>
    p.onPaaq ? <FollowButton onChange={(on) => on && onToast(`You're following ${p.name}`)} /> : <InviteButton onInvite={() => onToast(`Invite sent to ${p.name}`)} />

  return (
    <div className="flex flex-col gap-6">
      <SearchWithFilter id="participants-search" placeholder="Search by name, profession.." query={query} onQuery={setQuery} options={filterOptions} selected={group} onSelect={setGroup} />

      {nothing && <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-8 text-center text-sm text-ink-600">No one matches "{query.trim()}".</p>}

      {show('team') && team.length > 0 && (
        <ListCard title="Hosted by">
          {team.map((p) => (
            <PersonRow key={p.id} person={p} chip={<Chip>{p.teamRole}</Chip>} action={followAction(p)} />
          ))}
        </ListCard>
      )}

      {show('speakers') && speakers.length > 0 && (
        <ListCard title="Speakers">
          {speakers.map((p) => (
            <PersonRow key={p.id} person={p} action={followAction(p)} />
          ))}
        </ListCard>
      )}

      {show('attendees') && everyone.length > 0 && (
        <div className="flex flex-col gap-3">
          <ListCard title="Attendees" count={q ? everyone.length : goingCount}>
            {attendees.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                chip={p.id === 'me' ? <Chip tone="brand">You</Chip> : undefined}
                action={
                  p.id === 'me' ? undefined : p.onPaaq ? (
                    <RequestChatButton onRequest={() => onToast(`Chat request sent to ${p.name}`)} />
                  ) : (
                    <InviteButton onInvite={() => onToast(`Invite sent to ${p.name}`)} />
                  )
                }
              />
            ))}
          </ListCard>
          {!q && everyone.length > 9 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="rounded-full border border-ink-200 bg-white py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-100"
            >
              {showAll ? 'Show less' : 'View more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
