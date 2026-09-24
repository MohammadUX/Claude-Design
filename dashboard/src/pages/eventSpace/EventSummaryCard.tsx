import { Calendar03Icon, LinkSquare01Icon, Location01Icon, Share01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventArt } from '../../components/EventCard'
import Icon from '../../components/Icon'
import type { EventDetail } from '../../data/eventDetail'

/** Seconds until the event starts, counting down live (prototype: always starts ~21 minutes out). */
function useCountdown(startSeconds: number) {
  const [left, setLeft] = useState(startSeconds)
  useEffect(() => {
    if (startSeconds <= 0) return
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [startSeconds])
  return left
}

type EventSummaryCardProps = {
  detail: EventDetail
  poster: string
  onToast: (message: string) => void
  onJoin: () => void
}

export default function EventSummaryCard({ detail, poster, onToast, onJoin }: EventSummaryCardProps) {
  const { event, when, location } = detail
  const left = useCountdown(event.isLive ? 0 : 20 * 60 + 50)
  const canJoin = event.isLive || left === 0
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  const share = async () => {
    const url = `https://paaq.app/events/${event.id}`
    try {
      await navigator.clipboard.writeText(url)
      onToast('Event link copied')
    } catch {
      onToast(`Share this link: ${url}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-[20px] border-[1.5px] border-white bg-white/60 p-3 shadow-[0_4px_8px_rgba(0,0,0,0.06)] backdrop-blur-[60px] sm:flex-row">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl sm:size-[260px]">
        <EventArt event={{ ...event, image: poster }} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6 py-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => onToast('Added to your Google Calendar')}
              className="flex items-center gap-2 rounded-3xl border border-white/40 bg-white/20 px-3 py-1 text-xs leading-[1.2] font-medium text-ink-900 hover:bg-white/60"
            >
              <Icon icon={Calendar03Icon} size={18} className="text-[#1a73e8]" />
              Add to calendar
            </button>
            <Link to={`/events/${event.id}`} className="flex items-center gap-2 rounded-3xl px-2 py-1 text-xs leading-[1.2] font-medium text-ink-900 hover:bg-white/60">
              Event page
              <Icon icon={LinkSquare01Icon} size={16} />
            </Link>
          </div>
          <h1 className="text-xl leading-[1.1] font-semibold text-balance text-ink-900">{event.title}</h1>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex w-[34px] shrink-0 flex-col overflow-hidden rounded-[5px] border border-ink-100 bg-white/80 text-center">
                <span className="border-b border-brand-300 bg-brand-500 px-1 py-0.5 text-[8px] leading-[1.2] font-medium text-white">{when.month}</span>
                <span className="px-1 py-0.5 text-[9px] leading-[1.4] font-semibold text-ink-900">{when.day}</span>
              </div>
              <div className="flex flex-col gap-1 font-medium">
                <p className="text-sm leading-[1.4] text-ink-900">{when.longDate}</p>
                <p className="text-xs leading-[1.2] text-ink-800">{when.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex size-[34px] shrink-0 items-center justify-center rounded-md border border-ink-100 bg-white text-ink-900">
                <Icon icon={Location01Icon} size={19} />
              </div>
              <div className="flex flex-col gap-1 font-medium">
                <p className="text-sm leading-[1.4] text-ink-900">{location.label}</p>
                <p className="flex items-center gap-1 text-xs leading-[1.2] text-ink-800">
                  Hosted in:
                  <span className="flex items-center gap-1 px-2 text-ink-900">
                    {location.hostedIn === 'PAAQ' && <span className="font-bold text-brand-500">?</span>}
                    {location.hostedIn}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-stretch gap-0.5">
            <button
              onClick={canJoin ? onJoin : () => onToast(`The room opens in ${mm}:${ss}. We'll remind you at ${detail.when.time.split(' ')[0]} ${detail.when.time.split(' ')[1]}.`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-brand-300 bg-brand-500 px-6 py-2 text-base leading-[1.4] font-medium text-white tabular-nums hover:brightness-95"
            >
              {canJoin ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-white" />
                  Join now
                </>
              ) : (
                `${mm}:${ss} min left`
              )}
            </button>
            <button
              onClick={share}
              className="flex w-[130px] items-center justify-center gap-2 rounded-full border border-ink-100 bg-white px-6 py-2 text-base leading-[1.4] font-medium text-ink-800 hover:bg-ink-100"
            >
              <Icon icon={Share01Icon} />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
