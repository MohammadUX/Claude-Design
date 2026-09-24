import { ArrowRight01Icon, Calendar03Icon, Mortarboard01Icon, PlusSignIcon, Ticket02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

const items: { label: string; to: string; icon: IconSvgElement; tint: string }[] = [
  { label: 'Create a booking', to: '/bookings/create', icon: Ticket02Icon, tint: '#f59e0b' },
  { label: 'Create an event', to: '/events/create', icon: Calendar03Icon, tint: '#00b5b4' },
  { label: 'Create a channel', to: '/channels/create', icon: UserGroupIcon, tint: '#6d5bd0' },
  { label: 'Create a masterclass', to: '/masterclasses/create', icon: Mortarboard01Icon, tint: '#e5484d' },
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
        <div
          role="menu"
          className="create-menu absolute top-[56px] right-0 z-40 w-[264px] origin-top-right overflow-hidden rounded-[20px] border border-white/70 p-1.5 shadow-[0_24px_60px_-12px_rgba(35,40,40,0.28),0_0_0_1px_rgba(35,40,40,0.04)] backdrop-blur-2xl"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.99), rgba(248,249,249,0.98))' }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate(item.to)
              }}
              className="group flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-none"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[11px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_10px_-4px_var(--tint)] transition-transform group-hover:scale-105"
                style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${item.tint} 78%, white), ${item.tint})`, '--tint': item.tint } as React.CSSProperties}
              >
                <Icon icon={item.icon} size={18} strokeWidth={1.8} />
              </span>
              <span className="flex-1 text-[15px] leading-[1.3] font-medium text-ink-900">{item.label}</span>
              <Icon icon={ArrowRight01Icon} size={16} className="-translate-x-1 text-ink-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
