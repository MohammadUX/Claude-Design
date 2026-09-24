import { ArrowLeft02Icon, CloudSavingDone01Icon, ImageUpload01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import brandupScale from '../../assets/events/brandup-scale.jpg'
import creatorverseSpeaker from '../../assets/events/creatorverse-speaker.jpg'
import ipcSpeaker from '../../assets/events/ipc-speaker.jpg'
import thriveBorders from '../../assets/events/thrive-borders.jpg'
import Icon from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { publishEvent } from '../../data/createdEvents'
import type { EventDetail, Person, Sponsor } from '../../data/eventDetail'
import type { EventItem } from '../../data/mock'
import { usePosterAccent } from '../../lib/usePosterAccent'
import { cardDate, longDate, monthDay, stamp, time } from './dates'
import { detectPlatform, isUrl, paaqLink } from './links'
import { emptyDraft, htmlToAbout, loadDraft, readImage, saveDraft, timezones, type Draft, type Speaker, type SponsorEntry, type Ticket } from './model'
import DescriptionModal from './modals/DescriptionModal'
import DiscardModal from './modals/DiscardModal'
import InviteGuestModal from './modals/InviteGuestModal'
import PublishedModal from './modals/PublishedModal'
import SpeakerModals, { type SpeakerFlow } from './modals/SpeakerModals'
import { LibraryModal, NewSponsorModal } from './modals/SponsorModals'
import TagsModal from './modals/TagsModal'
import TicketModal from './modals/TicketModal'
import BasicsStep, { type BasicsErrors } from './steps/BasicsStep'
import PeopleStep from './steps/PeopleStep'
import SettingsStep from './steps/SettingsStep'
import SponsorsStep from './steps/SponsorsStep'
import TicketsStep, { type TicketErrors } from './steps/TicketsStep'

const STEPS = ['Event basics', 'Speakers and guests', 'Sponsors', 'Tickets', 'Event settings']
const COVERS = [creatorverseSpeaker, ipcSpeaker, thriveBorders, brandupScale]
const TYPE_CATEGORY = { Training: 'business', Masterclass: 'art', Webinar: 'technology', 'Live event': 'business' } as const

type ModalState =
  | { kind: 'description' }
  | { kind: 'tags' }
  | { kind: 'speaker'; flow: SpeakerFlow }
  | { kind: 'guests' }
  | { kind: 'sponsor'; editing?: SponsorEntry }
  | { kind: 'library' }
  | { kind: 'ticket'; editing?: Ticket }
  | { kind: 'discard' }
  | null

function validateBasics(d: Draft): BasicsErrors {
  const e: BasicsErrors = {}
  if (d.title.trim().length < 3) e.title = 'Give your event a name (at least 3 characters).'
  if (stamp(d.end) <= stamp(d.start)) e.end = 'The event has to end after it starts.'
  if (d.format === 'In person' && !d.venue.trim()) e.venue = 'Add where the event takes place.'
  if (d.format === 'Virtual' && d.virtualMode === 'other' && !isUrl(d.externalLink)) e.link = 'Paste the meeting link, like https://meet.google.com/abc-defg-hij.'
  return e
}

function validateTickets(d: Draft): TicketErrors {
  const e: TicketErrors = {}
  if (d.limitSales && (d.salesStart > d.salesEnd || d.salesEnd > d.start.date)) e.sales = 'Sales must start before they end, and end by the event date.'
  if (d.limitQty && !(d.maxPerPerson >= 1)) e.max = 'Set a limit of at least 1 ticket per person.'
  return e
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { show, toast } = useToast()
  const [draft, setDraft] = useState<Draft>(() => loadDraft() ?? emptyDraft())
  const [step, setStep] = useState(0)
  const [modal, setModal] = useState<ModalState>(null)
  const [tried, setTried] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState<{ event: EventItem; whenLine: string; link: string } | null>(null)
  const first = useRef(true)

  usePosterAccent(draft.poster ?? creatorverseSpeaker)

  const set = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), [])

  // "Saved as draft": autosave shortly after every change.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaving(true)
    const id = window.setTimeout(() => {
      saveDraft(draft)
      setSaving(false)
    }, 600)
    return () => window.clearTimeout(id)
  }, [draft])

  // Bring each new step into view. scrollIntoView also scrolls the frame that hosts the
  // prototype (e.g. the artifact viewer), where window.scrollTo alone does nothing.
  const topRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (first.current) return
    window.scrollTo({ top: 0 })
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [step])

  const basicsErrors = useMemo(() => (tried[0] ? validateBasics(draft) : {}), [draft, tried])
  const ticketErrors = useMemo(() => (tried[3] ? validateTickets(draft) : {}), [draft, tried])

  const leave = () => navigate('/events')

  const next = () => {
    setTried((t) => ({ ...t, [step]: true }))
    if (step === 0 && Object.keys(validateBasics(draft)).length) {
      window.setTimeout(() => document.querySelector('[class*="border-danger-500"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return show('Check the highlighted fields to continue.')
    }
    if (step === 3 && Object.keys(validateTickets(draft)).length) return show('Check your ticket preferences to continue.')
    if (step < STEPS.length - 1) return setStep(step + 1)
    publish()
  }

  const publish = () => {
    setPublishing(true)
    window.setTimeout(() => {
      const tz = timezones.find((t) => t.id === draft.timezone) ?? timezones[0]
      const paid = draft.tickets.filter((t) => t.paid).map((t) => t.discountPrice ?? t.price)
      const link = paaqLink(draft.title)
      const platform = detectPlatform(draft.externalLink)
      const event: EventItem = {
        id: `c${Date.now().toString(36)}`,
        title: draft.title.trim(),
        date: cardDate(draft.start.date, draft.start.minutes),
        priceFrom: paid.length ? Math.min(...paid) : null,
        attendees: 0,
        categoryId: TYPE_CATEGORY[draft.type ?? 'Webinar'],
        organizerId: 'o1',
        format: draft.format,
        image: draft.poster ?? undefined,
        hostedByMe: true,
        art: { from: '#0b3b3b', to: '#00b5b4', ink: '#ffffff', kicker: draft.type ?? 'Event' },
      }
      const me: Person = { id: 'me', name: 'Ada Obi', role: 'Product Designer', color: '#b45309', verified: true, onPaaq: true }
      const speakers: Person[] = draft.speakers.map((s: Speaker) => ({ id: s.id, name: s.name, role: s.title, color: s.color, photo: s.photo, verified: s.verified, onPaaq: s.source === 'paaq' }))
      const sponsors: Sponsor[] = draft.sponsors.map((s) => ({ id: s.id, name: s.name, tier: s.tier, color: s.color, website: s.website, logo: s.logo }))
      const about = htmlToAbout(draft.descriptionHtml)
      const { month, day } = monthDay(draft.start.date)
      const detail: Partial<EventDetail> = {
        host: me,
        when: { month, day, longDate: longDate(draft.start.date), time: `${time(draft.start.minutes)} – ${time(draft.end.minutes)} ${tz.long}` },
        location:
          draft.format === 'In person'
            ? { label: 'In person', hostedIn: draft.venue }
            : { label: 'Virtual event', hostedIn: draft.virtualMode === 'paaq' ? 'PAAQ' : (platform?.name ?? 'Online') },
        speakers,
        sponsors,
        about: { intro: about.intro || 'More details coming soon.', points: about.points, tags: draft.tags },
        attending: { count: 0, people: [] },
      }
      publishEvent(event, detail)
      saveDraft(null)
      setPublishing(false)
      setPublished({ event, whenLine: `${longDate(draft.start.date)} · ${time(draft.start.minutes)} – ${time(draft.end.minutes)} ${tz.offset}`, link: link.url })
    }, 900)
  }

  const uploadPoster = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return show('Choose a JPEG or PNG image.')
    set({ poster: await readImage(file) })
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div ref={topRef} className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-[1200px] scroll-mt-24 flex-col gap-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm leading-[1.4]">
            <Link to="/events" className="text-ink-700 hover:text-ink-900">
              Events
            </Link>
            <span className="text-ink-700">/</span>
            <span className="font-medium text-ink-900">Create event</span>
          </nav>
          <span role="status" className="flex items-center gap-2 rounded-full p-2 text-sm leading-[1.4] font-medium text-ink-900">
            <Icon icon={saving ? Loading03Icon : CloudSavingDone01Icon} size={20} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Saving…' : 'Saved as draft'}
          </span>
        </div>
        <div className="relative flex items-center gap-6 sm:gap-10">
          <div className="flex shrink-0 items-center gap-2">
            <button aria-label={step ? 'Previous step' : 'Leave'} onClick={() => (step ? setStep(step - 1) : setModal({ kind: 'discard' }))} className="flex size-9 items-center justify-center rounded-full text-ink-900 hover:bg-white/60">
              <Icon icon={ArrowLeft02Icon} size={20} />
            </button>
            <h1 className="text-lg leading-[1.4] font-semibold text-ink-900">Create Event</h1>
          </div>
          <div className="relative flex-1" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
            <div className="h-3 overflow-hidden rounded-3xl border border-white/25 bg-white/40 backdrop-blur-[60px]">
              <div className="h-full rounded-[40px] bg-gradient-to-r from-[#98fffe] via-[#12bebd] via-[68%] to-brand-500 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <span
              className="absolute top-1/2 flex h-[25px] -translate-y-1/2 items-center rounded-[26px] border-[1.5px] border-[#f3e3d1] bg-brand-500 px-3 text-xs leading-[1.2] font-medium whitespace-nowrap text-white transition-[left] duration-500 ease-out"
              style={{ left: `clamp(0px, calc(${progress}% - 60px), calc(100% - 130px))` }}
            >
              {STEPS[step]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        {/* Cover: shown exactly as the event card will crop it (square) */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[96px] lg:w-[400px]">
          <label
            className="group relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-600/40 bg-white/60"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              uploadPoster(e.dataTransfer.files[0])
            }}
          >
            {draft.poster ? (
              <img src={draft.poster} alt="Event cover" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink-800 shadow-sm">
                  <Icon icon={ImageUpload01Icon} size={24} />
                </span>
                <span className="text-base font-medium text-ink-900">Add a cover image</span>
                <span className="text-sm text-ink-700">Drag and drop, or click to upload. Square, at least 1080px.</span>
              </span>
            )}
            {draft.poster && (
              <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-lg bg-white/80 text-ink-900 backdrop-blur group-hover:bg-white">
                <Icon icon={ImageUpload01Icon} size={20} />
              </span>
            )}
            <input id="poster" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => uploadPoster(e.target.files?.[0])} />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-700">Or try a sample:</span>
            {COVERS.map((c, i) => (
              <button key={c} aria-label={`Use sample cover ${i + 1}`} aria-pressed={draft.poster === c} onClick={() => set({ poster: c })} className={`size-10 overflow-hidden rounded-lg border-2 ${draft.poster === c ? 'border-brand-500' : 'border-white'}`}>
                <img src={c} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          {step === 0 && (
            <BasicsStep draft={draft} set={set} errors={basicsErrors} onEditDescription={() => setModal({ kind: 'description' })} onEditTags={() => setModal({ kind: 'tags' })} onToast={show} />
          )}
          {step === 1 && (
            <PeopleStep
              draft={draft}
              set={set}
              onAddSpeaker={() => setModal({ kind: 'speaker', flow: { step: 'choose' } })}
              onEditSpeaker={(s) => setModal({ kind: 'speaker', flow: { step: 'form', editing: s } })}
              onInvite={() => setModal({ kind: 'guests' })}
            />
          )}
          {step === 2 && (
            <SponsorsStep draft={draft} set={set} onNew={() => setModal({ kind: 'sponsor' })} onEdit={(s) => setModal({ kind: 'sponsor', editing: s })} onLibrary={() => setModal({ kind: 'library' })} />
          )}
          {step === 3 && (
            <TicketsStep
              draft={draft}
              set={set}
              errors={ticketErrors}
              onAdd={() => setModal({ kind: 'ticket' })}
              onEdit={(t) => setModal({ kind: 'ticket', editing: t })}
              onUpgrade={() => {
                set({ plusPlan: true })
                show('Plus Events on: unlimited ticket types and a 4% fee.')
              }}
            />
          )}
          {step === 4 && <SettingsStep draft={draft} set={set} />}

          <div className="flex gap-4">
            <button onClick={next} disabled={publishing} className="flex flex-1 items-center justify-center gap-2 rounded-[74px] bg-brand-500 px-6 py-3.5 text-base leading-[1.4] font-medium text-white hover:brightness-95 disabled:opacity-70">
              {publishing && <Icon icon={Loading03Icon} size={18} className="animate-spin" />}
              {step === STEPS.length - 1 ? (publishing ? 'Publishing…' : 'Publish event') : 'Continue'}
            </button>
            <button onClick={() => setModal({ kind: 'discard' })} className="flex-1 rounded-[74px] border border-[#9aa2a2] px-6 py-3.5 text-base leading-[1.4] font-medium text-ink-900 hover:bg-white/60">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.kind === 'description' && (
        <DescriptionModal
          html={draft.descriptionHtml}
          title={draft.title}
          type={draft.type}
          onClose={() => setModal(null)}
          onSave={(html) => {
            set({ descriptionHtml: html.replace(/^(<br>|\s)+$/, '') })
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'tags' && (
        <TagsModal
          tags={draft.tags}
          onClose={() => setModal(null)}
          onSave={(tags) => {
            set({ tags: [...new Set(tags)] })
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'speaker' && (
        <SpeakerModals
          flow={modal.flow}
          added={draft.speakers}
          onFlow={(flow) => setModal(flow ? { kind: 'speaker', flow } : null)}
          onSave={(s) => {
            const exists = draft.speakers.some((x) => x.id === s.id)
            set({ speakers: exists ? draft.speakers.map((x) => (x.id === s.id ? s : x)) : [...draft.speakers, s] })
            if (modal.flow.step !== 'find') setModal(null)
            show(exists ? `${s.name} updated` : `${s.name} added as a speaker`)
          }}
        />
      )}
      {modal?.kind === 'guests' && (
        <InviteGuestModal
          guests={draft.guests}
          onClose={() => setModal(null)}
          onSave={(guests) => {
            set({ guests })
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'sponsor' && (
        <NewSponsorModal
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSave={(s) => {
            const exists = draft.sponsors.some((x) => x.id === s.id)
            set({ sponsors: exists ? draft.sponsors.map((x) => (x.id === s.id ? s : x)) : [...draft.sponsors, s] })
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'library' && (
        <LibraryModal
          existing={draft.sponsors}
          onClose={() => setModal(null)}
          onAdd={(list) => {
            set({ sponsors: [...draft.sponsors, ...list] })
            setModal(null)
            show(`${list.length} sponsor${list.length > 1 ? 's' : ''} added`)
          }}
        />
      )}
      {modal?.kind === 'ticket' && (
        <TicketModal
          editing={modal.editing}
          index={modal.editing ? draft.tickets.findIndex((t) => t.id === modal.editing!.id) : draft.tickets.length}
          onClose={() => setModal(null)}
          onSave={(t) => {
            const exists = draft.tickets.some((x) => x.id === t.id)
            set({ tickets: exists ? draft.tickets.map((x) => (x.id === t.id ? t : x)) : [...draft.tickets, t] })
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'discard' && (
        <DiscardModal
          onClose={() => setModal(null)}
          onKeepDraft={() => {
            saveDraft(draft)
            leave()
          }}
          onDiscard={() => {
            saveDraft(null)
            leave()
          }}
        />
      )}
      {published && (
        <PublishedModal
          event={published.event}
          whenLine={published.whenLine}
          link={published.link}
          onDashboard={() => navigate(`/events/${published.event.id}/manage`)}
          onPreview={() => navigate(`/events/${published.event.id}`)}
        />
      )}
      {toast}
    </div>
  )
}
