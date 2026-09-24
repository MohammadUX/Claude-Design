import { HashtagIcon } from '@hugeicons/core-free-icons'
import Avatar from '../../components/Avatar'
import { FollowButton } from '../../components/event/PersonActions'
import SponsorRow from '../../components/event/SponsorRow'
import Icon from '../../components/Icon'
import VerifiedBadge from '../../components/VerifiedBadge'
import type { EventDetail } from '../../data/eventDetail'

type OverviewTabProps = {
  detail: EventDetail
  goingCount: number
  onSeeAttendees: () => void
  onToast: (message: string) => void
}

export default function OverviewTab({ detail, goingCount, onSeeAttendees, onToast }: OverviewTabProps) {
  const { host, about, attending, sponsors } = detail
  const half = Math.ceil(Math.min(sponsors.length, 4) / 2)
  const shown = sponsors.slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base leading-[1.2] font-semibold text-ink-800">Hosted by</h2>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-3">
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
          <FollowButton size="tall" onChange={(on) => on && onToast(`You're following ${host.name}`)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base leading-[1.2] font-semibold text-ink-800">About this event</h2>
        <div className="flex flex-col gap-3 text-sm leading-[1.4] font-medium text-ink-800">
          <p>{about.intro}</p>
          <ul className="list-disc ps-5">
            {about.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {about.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full border border-ink-100 bg-ink-200 px-3 py-2 text-[13px] font-medium text-ink-900">
                <Icon icon={HashtagIcon} size={16} className="text-ink-700" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between font-medium text-ink-800">
          <h2 className="text-sm leading-[1.4] tracking-[2.24px] uppercase">Attending</h2>
          <button onClick={onSeeAttendees} className="text-base underline underline-offset-2 hover:text-brand-500">
            See all
          </button>
        </div>
        <button onClick={onSeeAttendees} className="flex w-fit items-center gap-2 text-left">
          <span className="flex items-center">
            {[{ id: 'me', name: 'Ada Obi', color: '#b45309' }, ...attending.people].slice(0, 4).map((p, i) => (
              <Avatar key={p.id} name={p.name} color={p.color} size={40} plain className={`border-2 border-white ${i < 3 ? '-mr-[11px]' : ''}`} />
            ))}
          </span>
          <span className="text-base leading-[1.4] font-medium text-[#1a1d1f]">{goingCount.toLocaleString()} People going</span>
        </button>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-sm leading-[1.4] font-medium tracking-[2.24px] text-ink-800 uppercase">Sponsored by</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            {shown.slice(0, half).map((s) => (
              <SponsorRow key={s.id} sponsor={s} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {shown.slice(half).map((s) => (
              <SponsorRow key={s.id} sponsor={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
