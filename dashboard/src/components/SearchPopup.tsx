import { ArrowRight01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allEvents, categories, featuredEvents, type Category, type EventItem } from '../data/mock'
import { EventArt } from './EventCard'
import Icon from './Icon'

type SearchPopupProps = {
  initialQuery: string
  onClose: () => void
  /** Show every match on the Events page (Enter with nothing highlighted, or "See all results"). */
  onSeeAll: (query: string) => void
  onPickCategory: (categoryId: string) => void
}

/** "Sat, Jul 4, 2026.  7.00 PM" → "Sat, Jul 4, 7.00 PM" as in the Figma search results. */
function shortDate(event: EventItem) {
  if (event.isLive) return 'Live now'
  return event.date.replace(/, \d{4}\.\s+/, ', ')
}

type Row = { kind: 'event'; event: EventItem } | { kind: 'category'; category: Category } | { kind: 'all' }

export default function SearchPopup({ initialQuery, onClose, onSeeAll, onPickCategory }: SearchPopupProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const q = query.trim().toLowerCase()

  const { events, matchedCategories } = useMemo(() => {
    if (!q) return { events: featuredEvents.slice(0, 4), matchedCategories: [] }
    return {
      events: allEvents.filter((e) => `${e.title} ${e.date} ${e.format}`.toLowerCase().includes(q)).slice(0, 5),
      matchedCategories: categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3),
    }
  }, [q])

  const rows: Row[] = [
    ...events.map((event) => ({ kind: 'event' as const, event })),
    ...matchedCategories.map((category) => ({ kind: 'category' as const, category })),
    ...(q ? [{ kind: 'all' as const }] : []),
  ]

  useEffect(() => {
    inputRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const choose = (row: Row | undefined) => {
    if (!row) return onSeeAll(query)
    if (row.kind === 'event') {
      onClose()
      navigate(`/events/${row.event.id}`)
    } else if (row.kind === 'category') {
      onPickCategory(row.category.id)
    } else {
      onSeeAll(query)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(rows[active])
    }
  }

  const rowClass = (i: number) =>
    `flex w-full items-center rounded-2xl p-1 text-left transition-colors ${i === active ? 'bg-ink-100' : 'bg-white hover:bg-ink-100'}`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-100/50 px-4 backdrop-blur-[12px]" onMouseDown={onClose} onKeyDown={onKeyDown}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search events"
        onMouseDown={(e) => e.stopPropagation()}
        className="mx-auto mt-[min(26vh,266px)] mb-10 flex w-full max-w-[785px] flex-col gap-1"
      >
        {/* Search field with the rainbow underline from the design */}
        <div className="relative">
          <label className="flex items-center gap-2.5 rounded-2xl border border-[#dadede] bg-white p-5">
            <Icon icon={Search01Icon} size={24} className="shrink-0 text-ink-700" />
            <input
              id="event-search"
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              placeholder="Search by name, date, session..."
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base leading-[1.4] font-medium text-ink-900 outline-none placeholder:text-ink-600"
            />
            <kbd className="hidden rounded-md border border-ink-200 px-1.5 py-0.5 text-xs font-medium text-ink-600 sm:block">Esc</kbd>
          </label>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 -bottom-[3px] h-[3px] rounded-full blur-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #8fd694 15%, #f59e6b 40%, #6b7373 62%, #8b7cf6 82%, transparent 100%)' }}
          />
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white px-6 pt-6 pb-10 shadow-[0_0_12px_0_#dadede]">
          <p className="text-base leading-[1.4] font-medium text-ink-900">Events</p>

          {events.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {events.map((event, i) => {
                return (
                  <li key={event.id}>
                    <button className={rowClass(i)} onMouseEnter={() => setActive(i)} onClick={() => choose(rows[i])}>
                      <span className="relative size-[60px] shrink-0 overflow-hidden rounded-lg">
                        <EventArt event={event} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-2 px-3">
                        <span className="truncate text-base leading-[1.2] font-semibold tracking-[-0.32px] text-ink-800">{event.title}</span>
                        <span className="flex items-center gap-2 text-sm leading-[1.4] font-medium whitespace-nowrap text-ink-700">
                          <span className={event.isLive ? 'text-danger-500' : ''}>{shortDate(event)}</span>
                          <span>.</span>
                          <span>{event.format}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-2 text-sm text-ink-600">No events match "{query.trim()}". Try a name, a date like "Jul 10", or "virtual".</p>
          )}

          {matchedCategories.length > 0 && (
            <>
              <p className="pt-2 text-base leading-[1.4] font-medium text-ink-900">Categories</p>
              <ul className="flex flex-wrap gap-2">
                {matchedCategories.map((category, j) => {
                  const i = events.length + j
                  return (
                    <li key={category.id}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(rows[i])}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium text-ink-900 transition-colors ${
                          i === active ? 'border-brand-300 bg-ink-100' : 'border-ink-200 bg-white hover:bg-ink-100'
                        }`}
                      >
                        <span style={{ color: category.color }}>
                          <Icon icon={category.icon} size={18} />
                        </span>
                        {category.name}
                        <span className="text-ink-600">{category.eventCount}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {q && (
            <button
              onMouseEnter={() => setActive(rows.length - 1)}
              onClick={() => choose({ kind: 'all' })}
              className={`mt-1 flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                active === rows.length - 1 ? 'border-brand-300 bg-ink-100 text-ink-900' : 'border-ink-200 text-ink-800 hover:bg-ink-100'
              }`}
            >
              See all results for "{query.trim()}"
              <Icon icon={ArrowRight01Icon} size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
