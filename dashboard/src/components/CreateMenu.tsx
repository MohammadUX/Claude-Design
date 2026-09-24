import { Calendar03Icon, Mortarboard01Icon, PlusSignIcon, Ticket02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

const items: { label: string; hint: string; to: string; icon: IconSvgElement }[] = [
  { label: 'Create a booking', hint: '1:1 sessions people can book with you', to: '/bookings/create', icon: Ticket02Icon },
  { label: 'Create an event', hint: 'Webinars, live events and trainings', to: '/events/create', icon: Calendar03Icon },
  { label: 'Create a channel', hint: 'A community around your topic', to: '/channels/create', icon: UserGroupIcon },
  { label: 'Create a masterclass', hint: 'A structured course you teach', to: '/masterclasses/create', icon: Mortarboard01Icon },
]

/** "Create New" in the top bar: opens a menu of the things a host can create. */
export default function CreateMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-2 rounded-[40px] border border-brand-300 bg-brand-500 px-4 text-base leading-[1.2] font-medium text-white hover:brightness-95"
      >
        <Icon icon={PlusSignIcon} className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`} />
        <span className="hidden sm:inline">Create New</span>
      </button>
      {open && (
        <div role="menu" className="absolute top-[52px] right-0 z-40 flex w-[300px] flex-col rounded-2xl border border-ink-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(35,40,40,0.14)]">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate(item.to)
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-ink-100 focus-visible:bg-ink-100 focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-ink-100 text-ink-800">
                <Icon icon={item.icon} size={18} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm leading-[1.4] font-semibold text-ink-900">{item.label}</span>
                <span className="text-xs leading-[1.4] font-medium text-ink-600">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
