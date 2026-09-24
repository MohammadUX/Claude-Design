import { Clock01Icon, FavouriteIcon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attendeeColors, formatPrice, type EventItem } from '../data/mock'
import Avatar from './Avatar'
import Icon from './Icon'

export function EventArt({ event, large = false }: { event: EventItem; large?: boolean }) {
  if (event.image) {
    return <img src={event.image} alt={`${event.title} poster`} className="absolute inset-0 size-full rounded-xl object-cover" />
  }
  const { from, to, ink, kicker } = event.art
  return (
    <div
      className={`absolute inset-0 flex flex-col justify-end gap-2 rounded-xl ${large ? 'p-8' : 'p-5'}`}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})`, color: ink }}
    >
      <span className={`font-semibold tracking-[0.12em] uppercase opacity-80 ${large ? 'text-sm' : 'text-[11px]'}`}>{kicker}</span>
      <span className={`leading-[1.05] font-bold tracking-tight ${large ? 'text-[40px]' : 'text-[26px]'}`}>{event.title}</span>
    </div>
  )
}

export default function EventCard({ event }: { event: EventItem }) {
  const [saved, setSaved] = useState(false)

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex w-full flex-col rounded-2xl p-1 drop-shadow-[0_2px_4px_#eceeee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
    >
      <div className="relative isolate flex aspect-square w-full flex-col overflow-hidden rounded-xl p-2">
        {/* Hover: the poster zooms 4% inside its frame; the card itself doesn't move */}
        <div className="absolute inset-0 transition-transform duration-[350ms] ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <EventArt event={event} />
        </div>
        <div className="relative flex w-full items-start justify-between">
          {event.isLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-danger-500 px-2.5 py-1 text-xs font-semibold text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          ) : (
            <span />
          )}
          <button
            aria-label={saved ? 'Remove from saved' : 'Save event'}
            aria-pressed={saved}
            onClick={(e) => {
              e.preventDefault()
              setSaved((s) => !s)
            }}
            className={`flex w-8 items-center justify-center rounded-[22px] bg-white/80 px-0.5 py-1.5 backdrop-blur-[10px] ${
              saved ? 'text-danger-500' : 'text-ink-800'
            }`}
          >
            <Icon icon={FavouriteIcon} className={saved ? '[&_path]:fill-current' : ''} />
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-1 py-4">
        <div className="flex flex-col gap-2">
          <p className="truncate text-base leading-[1.2] font-semibold tracking-[-0.32px] text-ink-800 transition-colors group-hover:text-ink-900">{event.title}</p>
          <div className="flex items-center gap-2 text-ink-700">
            <Icon icon={Clock01Icon} size={16} />
            <p className="text-sm leading-[1.4] font-medium whitespace-pre">{event.date}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-base leading-[1.2] font-semibold tracking-[-0.32px] text-ink-800">{formatPrice(event.priceFrom)}</p>
          <div className="flex items-center gap-1">
            <div className={`flex items-center ${event.attendees ? '' : 'hidden'}`}>
              {attendeeColors.map((color, i) => (
                <Avatar
                  key={color}
                  name={['A B', 'C D', 'E F'][i]}
                  color={color}
                  size={24}
                  className={`border-2 border-ink-100 ${i < 2 ? '-mr-2' : ''}`}
                />
              ))}
            </div>
            <p className="text-xs leading-[1.4] font-medium text-ink-700">{event.attendees ? `${event.attendees.toLocaleString()} Attendees` : 'New event'}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
