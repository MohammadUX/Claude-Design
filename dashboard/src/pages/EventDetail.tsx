import {
  Add01Icon,
  AppleIcon,
  ArrowLeft02Icon,
  Calendar03Icon,
  FavouriteIcon,
  HashtagIcon,
  LinkSquare02Icon,
  Location01Icon,
  Mic01Icon,
  PlayStoreIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { EventArt } from '../components/EventCard'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import VerifiedBadge from '../components/VerifiedBadge'
import { frostedOverGradient } from '../layouts/detailBackground'
import { extractAccent } from '../lib/dominantColor'
import { getEventDetail, type Person, type Sponsor } from '../data/eventDetail'
import { defaultPoster } from '../data/mock'
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
  const [following, setFollowing] = useState(false)
  const [invited, setInvited] = useState(false)
  return (
    <div className="flex w-full items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={person.name} color={person.color} size={32} />
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
      {person.onPaaq ? (
        <button
          onClick={() => setFollowing((f) => !f)}
          aria-pressed={following}
          className={`flex shrink-0 items-center gap-2 rounded-3xl border px-3 py-1 text-sm leading-[1.4] font-medium transition-colors ${
            following ? 'border-brand-500 bg-white text-brand-500' : 'border-brand-300 bg-brand-500 text-white hover:brightness-95'
          }`}
        >
          <Icon icon={following ? Tick02Icon : Add01Icon} />
          {following ? 'Following' : 'Follow'}
        </button>
      ) : (
        <button
          onClick={() => setInvited(true)}
          disabled={invited}
          className="flex shrink-0 items-center gap-2 rounded-3xl border border-brand-100 bg-brand-100 px-3 py-1 text-xs leading-[1.4] font-medium text-brand-700"
        >
          <Icon icon={invited ? Tick02Icon : Add01Icon} />
          {invited ? 'Invite sent' : 'Invite to PAAQ'}
        </button>
      )}
    </div>
  )
}

const tierStyle: Record<Sponsor['tier'], { label: string; className: string; style?: React.CSSProperties }> = {
  gold: {
    label: 'Gold Sponsor',
    className: 'border-[#e2ac0c] text-white',
    style: { backgroundImage: 'linear-gradient(90deg, #f5db6d 0%, #c5921d 24%, #ffc94e 52%, #c5921d 81%, #f5db6d 99%)' },
  },
  silver: {
    label: 'Silver Sponsor',
    className: 'border-[#a2a0a0] text-ink-900',
    style: { backgroundImage: 'linear-gradient(91deg, #9b9b9b 0%, #d0d0d0 13%, #fff 48%, #d0d0d0 88%, #9b9b9b 100%)' },
  },
  help: { label: 'Help Sponsor', className: 'border-ink-200 bg-white text-ink-800' },
}

function SponsorRow({ sponsor }: { sponsor: Sponsor }) {
  const tier = tierStyle[sponsor.tier]
  return (
    <div className="flex w-full items-center gap-3 rounded-[20px] p-1">
      <Avatar name={sponsor.name} color={sponsor.color} size={40} />
      <p className="text-base leading-[1.2] font-semibold whitespace-nowrap text-ink-900">{sponsor.name}</p>
      <span className={`rounded-[40px] border-[0.5px] px-3 py-1 text-xs leading-[1.4] font-medium whitespace-nowrap ${tier.className}`} style={tier.style}>
        {tier.label}
      </span>
      {sponsor.website && (
        <span title={sponsor.website} className="text-ink-700">
          <Icon icon={LinkSquare02Icon} />
        </span>
      )}
    </div>
  )
}

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const detail = getEventDetail(eventId)
  const { show, toast } = useToast()

  const [saved, setSaved] = useState(false)
  const [interested, setInterested] = useState(false)
  const [email, setEmail] = useState('ada.obi@example.com')
  const [editingEmail, setEditingEmail] = useState(false)
  const [showAllSpeakers, setShowAllSpeakers] = useState(false)
  const [showAllSponsors, setShowAllSponsors] = useState(false)
  const [attendeesOpen, setAttendeesOpen] = useState(false)

  const poster = detail ? (detail.event.image ?? defaultPoster) : null

  // Tint the page gradient with the poster's main colour.
  useEffect(() => {
    if (!poster) return
    let cancelled = false
    extractAccent(poster).then(([r, g, b]) => {
      if (!cancelled) document.documentElement.style.setProperty('--detail-accent', `rgb(${r} ${g} ${b})`)
    })
    return () => {
      cancelled = true
    }
  }, [poster])

  if (!detail) return <ComingSoon title="Event not found" note="This event isn't in the prototype data." />

  const { event, host, when, location, speakers, about, attending, sponsors } = detail
  const goingCount = attending.count + (interested ? 1 : 0)
  const visibleSpeakers = showAllSpeakers ? speakers : speakers.slice(0, 3)
  const visibleSponsors = showAllSponsors ? sponsors : sponsors.slice(0, 4)

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-4 pb-4">
      {/* Breadcrumb: sticks under the top bar and blurs whatever scrolls beneath it */}
      <div className="sticky top-[72px] z-20 -mx-4 -mt-5 flex items-center gap-2 px-4 py-3" style={frostedOverGradient}>
        <button
          aria-label="Back"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/events'))}
          className="flex size-10 items-center justify-center rounded-full text-ink-900 hover:bg-white/60"
        >
          <Icon icon={ArrowLeft02Icon} size={24} />
        </button>
        <nav className="flex min-w-0 items-center gap-1 text-base leading-[1.4] font-medium text-ink-900">
          <Link to="/events" className="hover:text-brand-500">
            Events
          </Link>
          <span>/</span>
          <span className="truncate">{event.title}</span>
        </nav>
      </div>

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
                        {event.format === 'Virtual' && <span className="font-bold text-brand-500">?</span>}
                        {location.hostedIn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP card */}
                <div className="flex w-full max-w-[359px] flex-col gap-3 rounded-[20px] border border-white bg-white/80 p-3">
                  <div className="flex items-center gap-3 py-2">
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
                  <button
                    onClick={() => {
                      setInterested((v) => !v)
                      show(interested ? 'You are no longer marked as interested' : `You're in! We'll send updates to ${email}`)
                    }}
                    aria-pressed={interested}
                    className={`flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-base leading-[1.4] font-medium transition-colors ${
                      interested ? 'border-brand-500 bg-white text-brand-500' : 'border-brand-300 bg-brand-500 text-white hover:brightness-95'
                    }`}
                  >
                    {interested && <Icon icon={Tick02Icon} />}
                    {interested ? "You're interested" : event.isLive ? 'Join live event' : "I'm interested"}
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-ink-200" />

            {/* Speakers */}
            <section className="flex flex-col gap-5">
              <SectionLabel onSeeAll={() => setShowAllSpeakers((v) => !v)} seeAllLabel={showAllSpeakers ? 'Show less' : 'See all'}>
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
                <ul className="list-disc ps-6">
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
              <SectionLabel onSeeAll={() => setAttendeesOpen(true)}>Attending</SectionLabel>
              <button onClick={() => setAttendeesOpen(true)} className="flex w-fit items-center gap-2 text-left">
                <span className="flex items-center">
                  {(interested ? [{ id: 'me', name: 'Ada Obi', color: '#b45309' }, ...attending.people] : attending.people).slice(0, 4).map((p, i) => (
                    <Avatar key={p.id} name={p.name} color={p.color} size={40} plain className={`border-2 border-white ${i < 3 ? '-mr-[11px]' : ''}`} />
                  ))}
                </span>
                <span className="text-base leading-[1.4] font-medium text-ink-900">{goingCount.toLocaleString()} People going</span>
              </button>
            </section>

            {/* Sponsors */}
            <section className="flex flex-col gap-5">
              <SectionLabel onSeeAll={() => setShowAllSponsors((v) => !v)} seeAllLabel={showAllSponsors ? 'Show less' : 'See all'}>
                Sponsored by
              </SectionLabel>
              <div className="flex flex-col gap-2">
                {visibleSponsors.map((s) => (
                  <SponsorRow key={s.id} sponsor={s} />
                ))}
              </div>
            </section>
          </div>

          {/* App download footer */}
          <div className="flex flex-col gap-3 border-t border-ink-200 pt-3">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-base leading-[1.4] font-medium text-ink-900">Download PAAQ App:</span>
              <span className="flex h-10 w-[115px] items-center gap-2 rounded-lg bg-black px-3 text-white">
                <Icon icon={AppleIcon} size={20} />
                <span className="flex flex-col leading-none">
                  <span className="text-[7px]">Download on the</span>
                  <span className="text-[11px] font-semibold">Apple Store</span>
                </span>
              </span>
              <span className="flex h-10 w-[115px] items-center gap-2 rounded-lg bg-black px-3 text-white">
                <Icon icon={PlayStoreIcon} size={20} className="text-[#34a853]" />
                <span className="flex flex-col leading-none">
                  <span className="text-[7px]">GET IT ON</span>
                  <span className="text-[11px] font-semibold">Google Play</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {attendeesOpen && (
        <Modal title={`${goingCount.toLocaleString()} people going`} onClose={() => setAttendeesOpen(false)}>
          <ul className="flex flex-col">
            {(interested ? [{ id: 'me', name: 'Ada Obi (you)', role: 'Attendee', color: '#b45309' }, ...attending.people] : attending.people).map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-ink-100 py-3 last:border-0">
                <Avatar name={p.name} color={p.color} size={36} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-ink-900">{p.name}</span>
                  <span className="text-xs text-ink-600">{p.role}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="pt-3 text-center text-sm text-ink-600">
            and {(goingCount - attending.people.length - (interested ? 1 : 0)).toLocaleString()} more
          </p>
        </Modal>
      )}

      {toast}
    </div>
  )
}
