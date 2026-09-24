import { Clock01Icon, Location01Icon } from '@hugeicons/core-free-icons'
import type { EventDetail } from '../../data/eventDetail'
import { EventArt } from '../EventCard'
import Icon from '../Icon'
import Overlay from '../Overlay'

type ConfirmRegistrationModalProps = {
  detail: EventDetail
  poster: string
  email: string
  onCancel: () => void
  onConfirm: () => void
}

/** Shown after "I'm interested": confirms the spot before taking the guest into the event space. */
export default function ConfirmRegistrationModal({ detail, poster, email, onCancel, onConfirm }: ConfirmRegistrationModalProps) {
  const { event, when, location } = detail

  return (
    <Overlay onClose={onCancel} labelledBy="confirm-registration-title" panelClassName="flex max-w-[461px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-1 shadow-[0_24px_64px_rgba(35,40,40,0.16)]">
      {(close) => (
      <>
        {/* Event summary */}
        <div className="flex items-center gap-3 rounded-xl bg-ink-100 p-2">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-lg">
            <EventArt event={{ ...event, image: poster }} />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-base leading-[1.2] font-semibold tracking-[-0.32px] text-ink-900">{event.title}</p>
            <p className="flex items-center gap-1.5 text-xs leading-[1.4] font-medium text-ink-700">
              <Icon icon={Clock01Icon} size={14} />
              {when.longDate} · {when.time.replace(' West Africa Time', ' WAT')}
            </p>
            <p className="flex items-center gap-1.5 text-xs leading-[1.4] font-medium text-ink-700">
              <Icon icon={Location01Icon} size={14} />
              {location.label}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 px-3 py-4">
          <div className="flex flex-col gap-2">
            <h2 id="confirm-registration-title" className="text-xl leading-[1.2] font-semibold tracking-[-0.4px] text-ink-800">
              {event.isLive ? 'Join this live event?' : 'Confirm your spot'}
            </h2>
            <p className="text-sm leading-[1.4] font-medium text-ink-700">
              We'll send your ticket and reminders to <span className="text-ink-900">{email}</span>. You'll get access to the guest list, speakers and
              everything shared during the event.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => close()}
              className="flex-1 rounded-full border border-ink-200 bg-ink-100 px-6 py-2 text-base leading-[1.4] font-medium text-ink-800 hover:bg-ink-200"
            >
              Cancel
            </button>
            <button
              autoFocus
              onClick={() => close(onConfirm)}
              className="flex-1 rounded-full border border-brand-300 bg-brand-500 px-6 py-2 text-base leading-[1.4] font-medium text-white hover:brightness-95"
            >
              Confirm
            </button>
          </div>
        </div>
      </>
      )}
    </Overlay>
  )
}
