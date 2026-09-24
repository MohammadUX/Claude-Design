import { useEffect } from 'react'
import attendeesBanner from '../assets/events/attendees-banner.webp'

type AttendeesLockedModalProps = {
  onClose: () => void
  onGetTicket: () => void
}

/** Figma "Small info card": shown instead of the guest list until the viewer has registered. */
export default function AttendeesLockedModal({ onClose, onGetTicket }: AttendeesLockedModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(35,40,40,0.1)] p-4 backdrop-blur-[20px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendees-locked-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex w-full max-w-[461px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-1"
      >
        {/* Banner artwork from the design: attendee faces on a soft teal glow */}
        <img src={attendeesBanner} alt="Attendees" className="aspect-[1359/447] w-full rounded-xl object-cover" />

        <div className="flex flex-col gap-8 px-3 py-4">
          <div className="flex flex-col gap-2">
            <h2 id="attendees-locked-title" className="text-xl leading-[1.2] font-semibold tracking-[-0.4px] text-ink-800">
              Register to view all attendees
            </h2>
            <p className="text-sm leading-[1.4] font-medium text-ink-700">The full guest list is only accessible to registered guests.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-ink-200 bg-ink-100 px-6 py-2 text-base leading-[1.4] font-medium text-ink-800 hover:bg-ink-200"
            >
              Got it
            </button>
            <button
              autoFocus
              onClick={onGetTicket}
              className="flex-1 rounded-full border border-brand-300 bg-brand-500 px-6 py-2 text-base leading-[1.4] font-medium text-white hover:brightness-95"
            >
              Get a ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
