import { AnonymousIcon, ArrowDown01Icon, ChartColumnIcon, CloudIcon, Megaphone01Icon, MessageQuestionIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useState } from 'react'
import Avatar from '../../components/Avatar'
import Icon from '../../components/Icon'
import type { Engagement, Person } from '../../data/eventDetail'
import SearchWithFilter from './SearchWithFilter'

type Kind = Engagement['kind']

const meta: Record<Kind, { label: string; icon: IconSvgElement; color: string }> = {
  qa: { label: 'Q&A', icon: MessageQuestionIcon, color: '#f97316' },
  poll: { label: 'Polls', icon: ChartColumnIcon, color: '#00b5b4' },
  wordcloud: { label: 'Word-cloud', icon: CloudIcon, color: '#00b5b4' },
  announcement: { label: 'Announcement', icon: Megaphone01Icon, color: '#00b5b4' },
}

const filterOptions: { value: 'all' | Kind; label: string }[] = [
  { value: 'all', label: 'All activity' },
  { value: 'qa', label: 'Q&A' },
  { value: 'poll', label: 'Polls' },
  { value: 'wordcloud', label: 'Word-cloud' },
  { value: 'announcement', label: 'Announcements' },
]

function Byline({ person }: { person: Person }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={person.name} color={person.color} size={24} plain />
      <span className="text-sm font-medium text-ink-900">{person.name}</span>
      <span className="rounded-3xl border border-ink-200 bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-800">Host</span>
    </div>
  )
}

function QACard({ item }: { item: Extract<Engagement, { kind: 'qa' }> }) {
  const [liked, setLiked] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <span className="flex size-7 items-center justify-center rounded-full border border-ink-200 text-ink-700">
            <Icon icon={AnonymousIcon} size={16} />
          </span>
          {item.askedBy ?? 'Anonymous'}
        </span>
        <span className="rounded-3xl border border-ink-200 bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-800">{item.tag}</span>
      </div>
      <p className="text-sm leading-[1.4] font-medium text-ink-900">{item.question}</p>
      <button
        onClick={() => setLiked((v) => !v)}
        aria-pressed={liked}
        className={`flex items-center gap-1.5 self-end rounded-full px-2 py-1 text-sm font-medium tabular-nums transition-colors ${liked ? 'text-brand-500' : 'text-ink-800 hover:bg-ink-100'}`}
      >
        <Icon icon={ThumbsUpIcon} size={18} className={liked ? '[&_path]:fill-current' : ''} />
        {item.likes + (liked ? 1 : 0)}
      </button>
    </div>
  )
}

function PollCard({ item }: { item: Extract<Engagement, { kind: 'poll' }> }) {
  const total = item.options.reduce((sum, o) => sum + o.votes, 0)
  const top = Math.max(...item.options.map((o) => o.votes))
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-[1.4] font-semibold text-ink-900">{item.question}</p>
      <ul className="flex flex-col gap-3">
        {item.options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0
          return (
            <li key={o.label} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-800">{o.label}</span>
              <span className="flex items-center gap-3">
                <span className="h-3 flex-1 overflow-hidden rounded-sm bg-ink-200">
                  <span className={`block h-full rounded-sm ${o.votes === top ? 'bg-brand-500' : 'bg-brand-300'}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                </span>
                <span className="w-10 text-right text-xs font-semibold text-ink-900 tabular-nums">{pct}%</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs font-medium text-ink-700">Total: {total} votes</p>
    </div>
  )
}

function WordCloudCard({ item }: { item: Extract<Engagement, { kind: 'wordcloud' }> }) {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-[1.4] font-medium text-ink-900">{item.prompt}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-ink-100 px-4 py-3">
        {item.words.map((w) => (
          <span key={w.text} className={`${sizes[w.weight - 1]} font-semibold ${w.weight >= 4 ? 'text-brand-700' : w.weight >= 3 ? 'text-brand-500' : 'text-ink-700'}`}>
            {w.text}
          </span>
        ))}
      </div>
      <Byline person={item.by} />
    </div>
  )
}

function AnnouncementCard({ item }: { item: Extract<Engagement, { kind: 'announcement' }> }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-[1.4] font-medium text-ink-900">{item.message}</p>
      <Byline person={item.by} />
    </div>
  )
}

function text(e: Engagement) {
  switch (e.kind) {
    case 'qa':
      return e.question
    case 'poll':
      return `${e.question} ${e.options.map((o) => o.label).join(' ')}`
    case 'wordcloud':
      return `${e.prompt} ${e.words.map((w) => w.text).join(' ')}`
    case 'announcement':
      return e.message
  }
}

/** Timeline of everything that happened in the room, each item collapsed until opened. */
export default function EngagementsTab({ engagements }: { engagements: Engagement[] }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<'all' | Kind>('all')
  const [open, setOpen] = useState<Set<string>>(() => new Set())

  const q = query.trim().toLowerCase()
  const items = engagements.filter((e) => (kind === 'all' || e.kind === kind) && (!q || `${meta[e.kind].label} ${e.at} ${text(e)}`.toLowerCase().includes(q)))
  const allOpen = items.length > 0 && items.every((e) => open.has(e.id))

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-6">
      <SearchWithFilter id="engagement-search" placeholder="Search by name, date, session" query={query} onQuery={setQuery} options={filterOptions} selected={kind} onSelect={setKind} />

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-8 text-center text-sm text-ink-600">Nothing from the session matches your search.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <button onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((e) => e.id)))} className="self-end text-sm font-medium text-ink-700 underline-offset-2 hover:underline">
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
          <ol className="relative flex flex-col gap-6 border-l border-dashed border-ink-600/50 pl-4">
            {items.map((e) => {
              const isOpen = open.has(e.id)
              const m = meta[e.kind]
              return (
                <li key={e.id} className="relative flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <span className="absolute top-2 -left-[19.5px] size-1.5 rounded-full bg-ink-700" aria-hidden />
                  <span className="w-[70px] shrink-0 pt-1 text-sm font-medium text-ink-800 underline underline-offset-2 tabular-nums">{e.at}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <button onClick={() => toggle(e.id)} aria-expanded={isOpen} className="flex w-fit items-center gap-3 rounded-full py-0.5 pr-3 text-sm font-medium text-ink-800 hover:text-ink-900">
                      <Icon icon={ArrowDown01Icon} size={16} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      <span className="flex size-8 items-center justify-center rounded-full border border-ink-200 bg-white" style={{ color: m.color }}>
                        <Icon icon={m.icon} size={18} />
                      </span>
                      {m.label}
                    </button>
                    {isOpen && (
                      <div className="rounded-2xl border border-ink-200 bg-white p-3">
                        {e.kind === 'qa' && <QACard item={e} />}
                        {e.kind === 'poll' && <PollCard item={e} />}
                        {e.kind === 'wordcloud' && <WordCloudCard item={e} />}
                        {e.kind === 'announcement' && <AnnouncementCard item={e} />}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
