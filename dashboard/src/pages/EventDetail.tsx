import { ArrowRight01Icon, Calendar03Icon, FavouriteIcon, HashtagIcon, Location01Icon, Mic01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AttendeesLockedModal from '../components/AttendeesLockedModal'
import Avatar from '../components/Avatar'
import AppDownloadFooter from '../components/event/AppDownloadFooter'
import ConfirmRegistrationModal from '../components/event/ConfirmRegistrationModal'
import EventBreadcrumb from '../components/event/EventBreadcrumb'
import { FollowButton, InviteButton } from '../components/event/PersonActions'
import SponsorRow from '../components/event/SponsorRow'
import { EventArt } from '../components/EventCard'
import Icon from '../components/Icon'
import { useToast } from '../components/Toast'
import VerifiedBadge from '../components/VerifiedBadge'
import { getEventDetail, type Person } from '../data/eventDetail'
import { defaultPoster } from '../data/mock'
import { usePosterAccent } from '../lib/usePosterAccent'
import { useRegistrations } from '../state/registrationContext'
import ComingSoon from './ComingSoon'

const glass = 'border border-white/40 bg-white/20'

function SectionLabel({ children, onSeeAll, seeAllLabel = 'See all' }: { children: ReactNode; onSeeAll?: () => void; seeAllLabel?: string }) {
  return (
    <div className="flex w-full items-center justify-between leading-[1.4] font-medium text-ink-800">
      <h2 className="text-sm tracking-[2.24px] uppercase">{children}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-base underline underline-offset-2 hover:text-brand-500">
          {seeAllLabel}
        </button>
      )}
    </div>
  )
}

function SpeakerRow({ person }: { person: Person }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={person.name} color={person.color} size={32} src={person.photo} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <p className="truncate text-base leading-[1.4] font-medium text-[#1a1d1f]">{person.name}</p>
            {person.verified && <VerifiedBadge />}
          </div>
          <div className="flex items-center gap-2">
            <p className="truncate text-sm leading-[1.4] font-medium text-ink-800">{person.role}</p>
            {person.onPaaq && (
              <>
                <span className="h-[13px] w-px bg-ink-800" aria-hidden />
                <span className={`flex items-center gap-1 rounded-3xl px-2 py-1 ${glass}`}>
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-verified text-white">
                    <Icon icon={Mic01Icon} size={11} strokeWidth={2} />
                  </span>
                  <span className="text-xs leading-[1.4] font-medium text-ink-900">Speaker</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {person.onPaaq ? <FollowButton /> : <InviteButton />}
    </div>
  )
}

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const detail = getEventDetail(eventId)
  const { show, toast } = useToast()

  const { email, setEmail, isRegistered, register } = useRegistrations()

  const [saved, setSaved] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [showAllSpeakers, setShowAllSpeakers] = useState(false)
  const [showAllSponsors, setShowAllSponsors] = useState(false)
  const [lockedOpen, setLockedOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [highlightRsvp, setHighlightRsvp] = useState(false)
  const rsvpRef = useRef<HTMLDivElement>(null)

  const poster = detail ? (detail.event.image ?? defaultPoster) : null
  usePosterAccent(poster)

  if (!detail) return <ComingSoon title="Event not found" note="This event isn't in the prototype data." />

  const { event, host, when, location, speakers, about, attending, sponsors } = detail
  const registered = isRegistered(event.id)
  const spaceUrl = `/events/${event.id}/space`
  const goingCount = attending.count + (registered ? 1 : 0)

  // The guest list is only for registered guests; everyone else gets the "Register to view" prompt.
  const openAttendees = () => (registered ? navigate(`${spaceUrl}?tab=participants`) : event.hostedByMe ? show('No one has registered yet. Share your event link to get guests.') : setLockedOpen(true))
  const visibleSpeakers = showAllSpeakers ? speakers : speakers.slice(0, 3)
  const visibleSponsors = showAllSponsors ? sponsors : sponsors.slice(0, 4)

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-4 pb-4">
      <EventBreadcrumb title={event.title} />

      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 lg:flex-row lg:items-start">
        {/* Poster: sticks while the details scroll */}
        <div className="w-full shrink-0 lg:sticky lg:top-[152px] lg:w-[450px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl">
            <EventArt event={{ ...event, image: poster ?? undefined }} large />
            <button
              aria-label={saved ? 'Remove from saved' : 'Save event'}
              aria-pressed={saved}
              onClick={() => {
                setSaved((s) => !s)
                show(saved ? 'Removed from saved events' : 'Saved to your events')
              }}
              className={`absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-[10px] ${
                saved ? 'text-danger-500' : 'text-ink-800'
              }`}
            >
              <Icon icon={FavouriteIcon} className={saved ? '[&_path]:fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => show('Added to your Google Calendar')}
                    className={`flex items-center gap-2 rounded-3xl px-3 py-2 text-xs leading-[1.2] font-medium text-ink-900 hover:bg-white/60 ${glass}`}
                  >
                    <Icon icon={Calendar03Icon} size={18} className="text-[#1a73e8]" />
                    Add to calendar
                  </button>
                  {event.isLive && (
                    <span className="flex items-center gap-1.5 rounded-full bg-danger-500 px-2.5 py-1 text-xs font-semibold text-white">
                      <span className="size-1.5 animate-pulse rounded-full bg-white" />
                      LIVE
                    </span>
                  )}
                </div>
                <h1 className="max-w-[560px] text-[32px] leading-[1.2] font-semibold text-balance text-ink-900">{event.title}</h1>
                <div className="flex flex-col gap-3">
                  <SectionLabel>Hosted by</SectionLabel>
                  <div className="flex items-center gap-3">
                    <Avatar name={host.name} color={host.color} size={32} />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <p className="text-base leading-[1.2] font-semibold text-[#1a1d1f]">{host.name}</p>
                        {host.verified && <VerifiedBadge />}
                      </div>
                      <p className="text-sm leading-[1.4] font-medium text-ink-800">{host.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <SectionLabel>When</SectionLabel>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex w-10 shrink-0 flex-col overflow-hidden rounded-lg border border-white bg-white/80 text-center">
                    <span className="border-b border-brand-300 bg-brand-500 px-2 py-1 text-xs leading-[1.2] text-white">{when.month}</span>
                    <span className="px-2 py-1 text-sm leading-[1.4] font-medium text-ink-900">{when.day}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base leading-[1.2] font-semibold text-ink-900">{when.longDate}</p>
                    <p className="text-sm leading-[1.4] text-ink-800">{when.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex size-[42px] shrink-0 items-center justify-center rounded-lg border border-white bg-white/80 text-ink-900">
                    <Icon icon={Location01Icon} size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base leading-[1.2] font-semibold text-ink-900">{location.label}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm leading-[1.4] text-ink-800">Hosted in:</span>
                      <span className={`flex items-center gap-1 rounded-3xl px-2 py-1 text-xs leading-[1.4] font-medium text-ink-900 ${glass}`}>
                        {location.hostedIn === 'PAAQ' && <span className="font-bold text-brand-500">?</span>}
                        {location.hostedIn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP card */}
                <div
                  ref={rsvpRef}
                  className={`flex w-full max-w-[359px] scroll-mt-[180px] flex-col gap-3 rounded-[20px] border bg-white/80 p-3 transition-shadow duration-500 ${
                    highlightRsvp ? 'border-brand-300 shadow-[0_0_0_4px_rgba(64,204,203,0.35)]' : 'border-white'
                  }`}
                >
                  <div className={`flex items-center gap-3 py-2 ${event.hostedByMe ? 'hidden' : ''}`}>
                    <Avatar name="Ada Obi" color="#b45309" size={24} />
                    {editingEmail ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          setEditingEmail(false)
                          show('Email updated')
                        }}
                      >
                        <input
                          id="rsvp-email"
                          type="email"
                          required
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm font-medium text-ink-900 outline-none focus:border-brand-300"
                        />
                        <button type="submit" className="text-sm font-medium text-brand-500">
                          Save
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="min-w-0 flex-1 truncate text-sm leading-[1.4] font-medium text-ink-700">{email}</p>
                        <button onClick={() => setEditingEmail(true)} className="text-sm leading-[1.4] font-medium text-brand-500 hover:underline">
                          Change
                        </button>
                      </>
                    )}
                  </div>
                  {event.hostedByMe ? (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-700">
                        <Icon icon={Tick02Icon} size={18} />
                        You're hosting this event
                      </p>
                      <button
                        onClick={() => navigate(`/events/${event.id}/manage`)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-300 bg-brand-500 px-6 py-3 text-base leading-[1.4] font-medium text-white hover:brightness-95"
                      >
                        Manage event
                        <Icon icon={ArrowRight01Icon} />
                      </button>
                    </div>
                  ) : registered ? (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-700">
                        <Icon icon={Tick02Icon} size={18} />
                        You're registered
                      </p>
                      <button
                        onClick={() => navigate(spaceUrl)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-300 bg-brand-500 px-6 py-3 text-base leading-[1.4] font-medium text-white hover:brightness-95"
                      >
                        Open event space
                        <Icon icon={ArrowRight01Icon} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-300 bg-brand-500 px-6 py-3 text-base leading-[1.4] font-medium text-white hover:brightness-95"
                    >
                      {event.isLive ? 'Join live event' : "I'm interested"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-ink-200" />

            {/* Speakers */}
            <section className={`flex flex-col gap-5 ${speakers.length ? '' : 'hidden'}`}>
              <SectionLabel onSeeAll={speakers.length > 3 ? () => setShowAllSpeakers((v) => !v) : undefined} seeAllLabel={showAllSpeakers ? 'Show less' : 'See all'}>
                Speakers
              </SectionLabel>
              <div className="flex flex-col">
                {visibleSpeakers.map((p) => (
                  <SpeakerRow key={p.id} person={p} />
                ))}
              </div>
            </section>

            {/* About */}
            <section className="flex flex-col gap-5">
              <SectionLabel>About this event</SectionLabel>
              <div className="flex flex-col gap-3 text-base leading-[1.4] font-medium text-ink-800">
                <p>{about.intro}</p>
                <ul className={`list-disc ps-6 ${about.points.length ? '' : 'hidden'}`}>
                  {about.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {about.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full border border-white bg-white/50 px-3 py-2 text-[13px] font-medium text-ink-900">
                      <Icon icon={HashtagIcon} size={16} className="text-ink-700" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Attending */}
            <section className="flex flex-col gap-5">
              <SectionLabel onSeeAll={openAttendees}>Attending</SectionLabel>
              <button onClick={openAttendees} className="flex w-fit items-center gap-2 text-left">
                <span className="flex items-center">
                  {(registered ? [{ id: 'me', name: 'Ada Obi', color: '#b45309' }, ...attending.people] : attending.people).slice(0, 4).map((p, i) => (
                    <Avatar key={p.id} name={p.name} color={p.color} size={40} plain className={`border-2 border-white ${i < 3 ? '-mr-[11px]' : ''}`} />
                  ))}
                </span>
                <span className="text-base leading-[1.4] font-medium text-ink-900">{goingCount ? `${goingCount.toLocaleString()} People going` : event.hostedByMe ? 'No one yet. Share your link to get guests.' : 'Be the first to join'}</span>
              </button>
            </section>

            {/* Sponsors */}
            <section className={`flex flex-col gap-5 ${sponsors.length ? '' : 'hidden'}`}>
              <SectionLabel onSeeAll={sponsors.length > 4 ? () => setShowAllSponsors((v) => !v) : undefined} seeAllLabel={showAllSponsors ? 'Show less' : 'See all'}>
                Sponsored by
              </SectionLabel>
              <div className="flex flex-col gap-2">
                {visibleSponsors.map((s) => (
                  <SponsorRow key={s.id} sponsor={s} />
                ))}
              </div>
            </section>
          </div>

          <AppDownloadFooter />
        </div>
      </div>

      {lockedOpen && (
        <AttendeesLockedModal
          onClose={() => setLockedOpen(false)}
          onGetTicket={() => {
            setLockedOpen(false)
            rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setHighlightRsvp(true)
            window.setTimeout(() => setHighlightRsvp(false), 2200)
          }}
        />
      )}

      {confirmOpen && poster && (
        <ConfirmRegistrationModal
          detail={detail}
          poster={poster}
          email={email}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            register(event.id)
            setConfirmOpen(false)
            navigate(spaceUrl, { state: { justRegistered: true } })
          }}
        />
      )}

      {toast}
    </div>
  )
}
