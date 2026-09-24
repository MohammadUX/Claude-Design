import { ArrowLeft01Icon, ArrowRight01Icon, Sun01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { longDate, MONTH_LONG, parse, time, toIso } from './dates'

const SLOTS = Array.from({ length: (23 - 6) * 4 + 4 }, (_, i) => 6 * 60 + i * 15) // 6:00 AM – 11:45 PM

type DateTimePickerProps = {
  label: string
  value: { date: string; minutes: number }
  /** Earliest selectable day (ISO). */
  minDate: string
  onChange: (v: { date: string; minutes: number }) => void
  onClose: () => void
}

/** Calendar + 15-minute time list, as in the Figma "Selecting date and time" screen. */
export default function DateTimePicker({ label, value, minDate, onChange, onClose }: DateTimePickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [view, setView] = useState(() => {
    const d = parse(value.date)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])

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
      className="absolute top-full right-0 z-40 mt-2 flex w-[min(520px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_16px_40px_rgba(35,40,40,0.16)]"
    >
      <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-full border border-ink-200 text-ink-800">
          <Icon icon={Sun01Icon} size={16} />
        </span>
        <p className="text-sm leading-[1.4] font-medium text-ink-800">
          {label} {longDate(value.date)} · {time(value.minutes)}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <button aria-label="Previous month" disabled={!canPrev} onClick={() => shift(-1)} className="flex size-7 items-center justify-center rounded-full border border-ink-200 text-ink-800 disabled:opacity-30">
              <Icon icon={ArrowLeft01Icon} size={16} />
            </button>
            <p className="text-base leading-[1.4] font-medium text-ink-900">
              {MONTH_LONG[view.m]} {view.y}
            </p>
            <button aria-label="Next month" onClick={() => shift(1)} className="flex size-7 items-center justify-center rounded-full border border-ink-200 text-ink-800">
              <Icon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="pb-1 text-xs font-medium text-ink-600">
                {d}
              </span>
            ))}
            {cells.map((iso, i) =>
              iso ? (
                <button
                  key={iso}
                  disabled={parse(iso) < min}
                  onClick={() => onChange({ date: iso, minutes: value.minutes })}
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors disabled:text-ink-600/40 ${
                    iso === value.date ? 'bg-brand-500 text-white' : 'text-ink-900 hover:bg-ink-100 disabled:hover:bg-transparent'
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
        <ul ref={listRef} role="listbox" aria-label="Time" className="flex max-h-[268px] flex-col gap-0.5 overflow-y-auto border-t border-ink-200 p-2 sm:w-[160px] sm:border-t-0 sm:border-l">
          {SLOTS.map((m) => (
            <li key={m}>
              <button
                role="option"
                aria-selected={m === value.minutes}
                onClick={() => {
                  onChange({ date: value.date, minutes: m })
                  onClose()
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums ${
                  m === value.minutes ? 'bg-brand-100 text-brand-700' : 'text-ink-800 hover:bg-ink-100'
                }`}
              >
                <Icon icon={Sun01Icon} size={14} className="opacity-60" />
                {time(m).toLowerCase()}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
