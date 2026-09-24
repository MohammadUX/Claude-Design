import { ArrowLeft01Icon, ArrowRight01Icon, Moon02Icon, Sun01Icon, Sun03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { longDate, MONTH_LONG, parse, time, toIso } from './dates'

const SLOTS = Array.from({ length: (23 - 6) * 4 + 4 }, (_, i) => 6 * 60 + i * 15) // 6:00 AM – 11:45 PM
const GROUPS = [
  { label: 'Morning', icon: Sun03Icon, from: 0, to: 12 * 60 },
  { label: 'Afternoon', icon: Sun01Icon, from: 12 * 60, to: 17 * 60 },
  { label: 'Evening', icon: Moon02Icon, from: 17 * 60, to: 24 * 60 },
]

type DateTimePickerProps = {
  label: string
  value: { date: string; minutes: number }
  /** Earliest selectable day (ISO). */
  minDate: string
  onChange: (v: { date: string; minutes: number }) => void
  onClose: () => void
}

/** Calendar + time list, as in the Figma "Selecting date and time" screen. */
export default function DateTimePicker({ label, value, minDate, onChange, onClose }: DateTimePickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState(() => {
    const d = parse(value.date)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])

  // Centre the chosen time inside the list only (never scroll the page).
  useLayoutEffect(() => {
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (list && el) list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2
  }, [])

  const pickTime = (m: number) => {
    onChange({ date: value.date, minutes: m })
    window.setTimeout(onClose, 180) // let the selection show before closing
  }

  const first = new Date(view.y, view.m, 1)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(view.y, view.m, i + 1)))]
  const min = parse(minDate)
  const canPrev = new Date(view.y, view.m, 1) > new Date(min.getFullYear(), min.getMonth(), 1)
  const shift = (n: number) => setView(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }))

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${label} date and time`}
      className="picker-in absolute top-full right-0 z-40 mt-2 flex w-[min(540px,calc(100vw-32px))] flex-col gap-1.5 rounded-[20px] border border-white p-1.5 shadow-[0_24px_60px_-12px_rgba(35,40,40,0.28),0_0_0_1px_rgba(35,40,40,0.04)]"
      style={{ background: '#f6f7f7' }}
    >
      <div className="flex items-center gap-3 px-2.5 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-full border border-ink-600/30 text-ink-800">
          <Icon icon={value.minutes >= 17 * 60 ? Moon02Icon : Sun01Icon} size={16} />
        </span>
        <p className="text-sm leading-[1.4] font-medium text-ink-800">
          {label} {longDate(value.date)} · {time(value.minutes)}
        </p>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-white sm:flex-row">
        {/* Calendar */}
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <button aria-label="Previous month" disabled={!canPrev} onClick={() => shift(-1)} className="flex size-8 items-center justify-center rounded-full bg-ink-100 text-ink-800 transition-colors hover:bg-ink-200 disabled:opacity-30">
              <Icon icon={ArrowLeft01Icon} size={16} />
            </button>
            <p className="text-base leading-[1.4] font-semibold text-ink-900">
              {MONTH_LONG[view.m]} {view.y}
            </p>
            <button aria-label="Next month" onClick={() => shift(1)} className="flex size-8 items-center justify-center rounded-full bg-ink-100 text-ink-800 transition-colors hover:bg-ink-200">
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="pb-1.5 text-xs font-medium text-ink-600">
                {d}
              </span>
            ))}
            {cells.map((iso, i) =>
              iso ? (
                <button
                  key={iso}
                  disabled={parse(iso) < min}
                  aria-pressed={iso === value.date}
                  onClick={() => onChange({ date: iso, minutes: value.minutes })}
                  className={`mx-auto flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors duration-150 disabled:text-ink-600/35 ${
                    iso === value.date ? 'bg-brand-500 text-white shadow-[0_4px_10px_-4px_#00b5b4]' : 'text-ink-900 hover:bg-ink-100 disabled:hover:bg-transparent'
                  }`}
                >
                  {parse(iso).getDate()}
                </button>
              ) : (
                <span key={`e${i}`} />
              ),
            )}
          </div>
        </div>

        {/* Time list: scrolls without a visible bar, soft fade at the edges */}
        <div className="relative border-t border-ink-100 sm:w-[176px] sm:border-t-0 sm:border-l">
          <div
            ref={listRef}
            role="listbox"
            aria-label="Time"
            className="no-scrollbar h-[260px] overflow-y-auto px-2 py-3 sm:h-[316px]"
            style={{ maskImage: 'linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%)' }}
          >
            {GROUPS.map((g) => (
              <div key={g.label} className="flex flex-col gap-0.5 pb-2">
                <p className="flex items-center gap-1.5 px-3 pt-1 pb-1 text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase">
                  <Icon icon={g.icon} size={13} />
                  {g.label}
                </p>
                {SLOTS.filter((m) => m >= g.from && m < g.to).map((m) => {
                  const on = m === value.minutes
                  return (
                    <button
                      key={m}
                      role="option"
                      aria-selected={on}
                      onClick={() => pickTime(m)}
                      className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm tabular-nums transition-colors duration-150 ${
                        on ? 'bg-brand-100/60 font-semibold text-brand-700' : 'font-medium text-ink-800 hover:bg-ink-100'
                      }`}
                    >
                      {time(m)}
                      {on && <Icon icon={Tick02Icon} size={16} />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
