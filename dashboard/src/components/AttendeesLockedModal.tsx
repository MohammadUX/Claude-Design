import { useEffect } from 'react'
import type { Person } from '../data/eventDetail'
import Avatar from './Avatar'

type AttendeesLockedModalProps = {
  people: Person[]
  onClose: () => void
  onGetTicket: () => void
}

/** Figma "Small info card": shown instead of the guest list until the viewer has registered. */
export default function AttendeesLockedModal({ people, onClose, onGetTicket }: AttendeesLockedModalProps) {
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
        {/* Banner: soft brand glow behind the attendee faces */}
        <div
          className="relative flex h-[149px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl"
          style={{
            backgroundColor: '#e9eeee',
            backgroundImage:
              'radial-gradient(60% 90% at 50% 40%, rgba(64,204,203,0.75), transparent 70%), radial-gradient(40% 70% at 22% 70%, rgba(134,239,172,0.55), transparent 70%), radial-gradient(45% 80% at 80% 30%, rgba(147,197,253,0.55), transparent 70%)',
          }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[18px]" />
          <div className="relative flex items-center">
            {people.slice(0, 4).map((p, i) => (
              <Avatar key={p.id} name={p.name} color={p.color} size={60} plain className={`border-[3px] border-white ${i < 3 ? '-mr-3' : ''}`} />
            ))}
          </div>
          <p className="relative text-base leading-[1.2] font-semibold text-[#1a1d1f]">Attendees</p>
        </div>

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
