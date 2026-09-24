import {
  Calendar04Icon,
  Cancel01Icon,
  Copy01Icon,
  Edit04Icon,
  HashtagIcon,
  InternetIcon,
  Link01Icon,
  Location01Icon,
  PinLocation03Icon,
  SquareLock02Icon,
  Tick02Icon,
  UserIcon,
  Video02Icon,
} from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../../components/Icon'
import { shortDate, time } from '../dates'
import DateTimePicker from '../DateTimePicker'
import { timezones, TODAY, type Draft } from '../model'
import { eventTypes, venues } from '../options'
import { detectPlatform, paaqLink } from '../links'
import { Dropdown, ErrorText, panel, Radio, SectionTitle } from '../ui'

export type BasicsErrors = Partial<Record<'title' | 'end' | 'venue' | 'link', string>>

type Props = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  errors: BasicsErrors
  onEditDescription: () => void
  onEditTags: () => void
  onToast: (m: string) => void
}

function CopyRow({ value, label, onToast }: { value: string; label: string; onToast: (m: string) => void }) {
  const [done, setDone] = useState(false)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon icon={Link01Icon} size={18} className="text-ink-700" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 select-all">{value}</span>
      <button
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
          } catch {
            /* ignored: value is selectable */
          }
          setDone(true)
          onToast(`${label} copied`)
          window.setTimeout(() => setDone(false), 1500)
        }}
        className="flex size-8 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
      >
        <Icon icon={done ? Tick02Icon : Copy01Icon} size={18} />
      </button>
    </div>
  )
}

export default function BasicsStep({ draft, set, errors, onEditDescription, onEditTags, onToast }: Props) {
  const [picker, setPicker] = useState<'start' | 'end' | null>(null)
  const [venueQuery, setVenueQuery] = useState('')
  const [venueOpen, setVenueOpen] = useState(false)
  const venueRef = useRef<HTMLDivElement>(null)
  const tz = timezones.find((t) => t.id === draft.timezone) ?? timezones[0]
  const platform = detectPlatform(draft.externalLink)
  const link = paaqLink(draft.title)

  useEffect(() => {
    if (!venueOpen) return
    const close = (e: MouseEvent) => !venueRef.current?.contains(e.target as Node) && setVenueOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [venueOpen])

  const setStart = (v: Draft['start']) => {
    // Keep the event length when the start moves, so End never lands before Start.
    const length = Math.max(60, (new Date(`${draft.end.date}T00:00`).getTime() + draft.end.minutes * 60000 - (new Date(`${draft.start.date}T00:00`).getTime() + draft.start.minutes * 60000)) / 60000)
    const endStamp = new Date(`${v.date}T00:00`).getTime() + (v.minutes + length) * 60000
    const end = new Date(endStamp)
    const endIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    set({ start: v, end: { date: endIso, minutes: end.getHours() * 60 + end.getMinutes() } })
  }

  const venueMatches = venues.filter((v) => v.toLowerCase().includes(venueQuery.trim().toLowerCase())).slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      {/* Visibility, type and name */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <Dropdown
            value={draft.visibility}
            onChange={(v) => set({ visibility: v })}
            options={[
              { value: 'Public', label: 'Public', hint: 'Anyone can find and join', icon: InternetIcon },
              { value: 'Private', label: 'Private', hint: 'Only people with the link', icon: SquareLock02Icon },
            ]}
          />
          <Dropdown
            value={draft.type ?? 'Webinar'}
            onChange={(v) => set({ type: v })}
            options={eventTypes.map((t) => ({ value: t.type, label: t.type, hint: t.hint, icon: t.icon }))}
          />
        </div>
        <div className={`rounded-[20px] border bg-white/80 px-4 py-3 ${errors.title ? 'border-danger-500' : 'border-white'}`}>
          <label htmlFor="event-name" className="sr-only">
            Event name
          </label>
          <input
            id="event-name"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Write event name"
            maxLength={90}
            className="w-full bg-transparent py-3 text-2xl leading-[1.1] font-medium text-ink-900 outline-none placeholder:text-ink-600"
          />
        </div>
        {errors.title && <ErrorText>{errors.title}</ErrorText>}
      </div>

      {/* Date & time */}
      <div className="flex flex-col gap-4">
        <SectionTitle
          icon={Calendar04Icon}
          right={
            <Dropdown
              value={draft.timezone}
              onChange={(v) => set({ timezone: v })}
              menuAlign="right"
              className="border-transparent bg-transparent font-normal backdrop-blur-none hover:bg-white/60"
              render={() => `${tz.id} (${tz.offset.replace('GMT', 'GMT ')})`}
              options={timezones.map((t) => ({ value: t.id, label: `${t.city} — ${t.offset}` }))}
            />
          }
        >
          Date &amp; time
        </SectionTitle>
        <div className={`${panel} relative ${picker ? 'z-30' : ''}`}>
          {(['start', 'end'] as const).map((which, i) => {
            const v = draft[which]
            return (
              <div key={which} className={`relative flex flex-wrap items-center justify-between gap-3 px-6 py-4 ${i === 0 ? 'border-b border-ink-600/20' : ''}`}>
                <span className="text-sm leading-[1.4] font-medium text-ink-800">{which === 'start' ? 'Start' : 'End'}</span>
                <div className="flex w-full max-w-[417px] items-center gap-3">
                  <button
                    onClick={() => setPicker(picker === which ? null : which)}
                    aria-expanded={picker === which}
                    className={`flex-1 rounded-xl border bg-white px-4 py-2 text-left text-sm leading-[1.4] font-medium text-ink-900 hover:border-brand-300 ${
                      which === 'end' && errors.end ? 'border-danger-500' : 'border-ink-700/5'
                    }`}
                  >
                    {shortDate(v.date)}
                  </button>
                  <span className="h-[23px] w-0.5 bg-ink-200" aria-hidden />
                  <button
                    onClick={() => setPicker(picker === which ? null : which)}
                    className={`w-[113px] rounded-xl border bg-white px-4 py-2 text-left text-sm leading-[1.4] font-medium text-ink-900 tabular-nums hover:border-brand-300 ${
                      which === 'end' && errors.end ? 'border-danger-500' : 'border-ink-700/5'
                    }`}
                  >
                    {time(v.minutes)}
                  </button>
                </div>
                {picker === which && (
                  <DateTimePicker
                    label={which === 'start' ? 'Event starting' : 'Event ending'}
                    value={v}
                    minDate={which === 'start' ? TODAY : draft.start.date}
                    onChange={(nv) => (which === 'start' ? setStart(nv) : set({ end: nv }))}
                    onClose={() => setPicker(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
        {errors.end && <ErrorText>{errors.end}</ErrorText>}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-4">
        <SectionTitle icon={UserIcon}>Event details</SectionTitle>
        <div className="flex flex-col gap-2">
          <button onClick={onEditDescription} className={`${panel} flex gap-3 p-4 text-left hover:bg-white`}>
            <Icon icon={Edit04Icon} size={20} className="shrink-0 text-ink-900" />
            {draft.descriptionHtml ? (
              <div className="rich-text rich-text-sm line-clamp-4 min-w-0 flex-1 text-base leading-[1.4] text-ink-900" dangerouslySetInnerHTML={{ __html: draft.descriptionHtml }} />
            ) : (
              <span className="text-base leading-[1.4] text-ink-900">Add a description</span>
            )}
          </button>
          <div className={`${panel} flex flex-wrap items-center gap-2 p-4`}>
            {draft.tags.map((t) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-ink-200 bg-ink-100 py-2 pr-2.5 pl-3 text-[13px] font-medium text-ink-900">
                <span className="flex items-center gap-1">
                  <Icon icon={HashtagIcon} size={16} />
                  {t}
                </span>
                <button aria-label={`Remove ${t}`} onClick={() => set({ tags: draft.tags.filter((x) => x !== t) })} className="flex text-ink-700 hover:text-ink-900">
                  <Icon icon={Cancel01Icon} size={16} />
                </button>
              </span>
            ))}
            <button onClick={onEditTags} className="flex items-center gap-2 rounded-full px-1 py-1 text-base leading-[1.4] text-ink-900 hover:text-brand-700">
              <Icon icon={HashtagIcon} size={20} />
              {draft.tags.length ? 'Add tags' : 'Add tags'}
            </button>
          </div>
        </div>
      </div>

      {/* Format */}
      <div className="flex flex-col gap-4">
        <SectionTitle
          icon={PinLocation03Icon}
          right={
            <div role="radiogroup" aria-label="Event format" className="flex items-center gap-6">
              <Radio checked={draft.format === 'In person'} onChange={() => set({ format: 'In person' })}>
                <Icon icon={Location01Icon} size={20} />
                In person
              </Radio>
              <Radio checked={draft.format === 'Virtual'} onChange={() => set({ format: 'Virtual' })}>
                <Icon icon={Video02Icon} size={20} />
                Virtual
              </Radio>
            </div>
          }
        >
          Event format
        </SectionTitle>

        {draft.format === 'In person' ? (
          <div ref={venueRef} className="relative">
            {draft.venue && !venueOpen ? (
              <div className={`${panel} flex items-center gap-3 p-4`}>
                <Icon icon={Location01Icon} size={20} className="text-ink-900" />
                <span className="min-w-0 flex-1 text-base text-ink-900">{draft.venue}</span>
                <button onClick={() => (setVenueQuery(''), setVenueOpen(true))} className="text-sm font-medium text-brand-700 hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 rounded-xl border bg-white/80 p-4 ${errors.venue ? 'border-danger-500' : 'border-white'}`}>
                <Icon icon={Location01Icon} size={20} className="text-ink-900" />
                <input
                  id="venue"
                  value={venueQuery}
                  onFocus={() => setVenueOpen(true)}
                  onChange={(e) => {
                    setVenueQuery(e.target.value)
                    setVenueOpen(true)
                  }}
                  placeholder={venueOpen ? 'Search your location' : 'Add location'}
                  className="min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-900"
                />
              </label>
            )}
            {venueOpen && (
              <ul className="pop-in absolute top-full left-0 z-30 mt-1.5 w-full max-w-[420px] rounded-xl border border-ink-200 bg-white p-1 shadow-[0_12px_32px_rgba(35,40,40,0.12)]">
                {venueMatches.map((v) => (
                  <li key={v}>
                    <button
                      onClick={() => {
                        set({ venue: v })
                        setVenueOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-900 hover:bg-ink-100"
                    >
                      <Icon icon={Location01Icon} size={16} className="text-ink-700" />
                      {v}
                    </button>
                  </li>
                ))}
                {venueQuery.trim() && (
                  <li>
                    <button
                      onClick={() => {
                        set({ venue: venueQuery.trim() })
                        setVenueOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-ink-100"
                    >
                      Use "{venueQuery.trim()}"
                    </button>
                  </li>
                )}
              </ul>
            )}
            {errors.venue && <div className="mt-2"><ErrorText>{errors.venue}</ErrorText></div>}
          </div>
        ) : (
          <div className={`${panel} flex flex-col divide-y divide-ink-200`}>
            <div role="radiogroup" aria-label="Where it happens" className="flex items-center gap-6 px-4 py-3">
              <Radio size="sm" checked={draft.virtualMode === 'paaq'} onChange={() => set({ virtualMode: 'paaq' })}>
                Use PAAQ
              </Radio>
              <Radio size="sm" checked={draft.virtualMode === 'other'} onChange={() => set({ virtualMode: 'other' })}>
                Other platform
              </Radio>
            </div>
            {draft.virtualMode === 'paaq' ? (
              <>
                <CopyRow value={`https://${link.url}`} label="Event room link" onToast={onToast} />
                <CopyRow value={link.code} label="Room code" onToast={onToast} />
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <label htmlFor="ext-link" className="flex items-center gap-2 text-base text-ink-900">
                  <Icon icon={Link01Icon} size={18} className="text-ink-700" />
                  Add link
                </label>
                <div className={`flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-lg border bg-ink-100 px-3 ${errors.link ? 'border-danger-500' : 'border-ink-200'}`}>
                  {platform && (
                    <span className="flex shrink-0 items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold" style={{ color: platform.color }}>
                      <span className="size-2 rounded-full" style={{ background: platform.color }} />
                      {platform.name}
                    </span>
                  )}
                  <input
                    id="ext-link"
                    value={draft.externalLink}
                    onChange={(e) => set({ externalLink: e.target.value })}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-600"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {errors.link && <ErrorText>{errors.link}</ErrorText>}
      </div>
    </div>
  )
}
