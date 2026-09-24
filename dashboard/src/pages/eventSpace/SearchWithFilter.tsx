import { ArrowDown01Icon, FilterHorizontalIcon, Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'

type SearchWithFilterProps<T extends string> = {
  id: string
  placeholder: string
  query: string
  onQuery: (q: string) => void
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}

/** Search field plus a small single-choice Filter menu, as on the Participants and Engagements tabs. */
export default function SearchWithFilter<T extends string>(props: SearchWithFilterProps<T>) {
  const { id, placeholder, query, onQuery, options, selected, onSelect } = props
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = options[0]?.value !== selected

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="flex h-11 items-center gap-2">
      <label htmlFor={id} className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[40px] border border-ink-200 bg-white px-5 focus-within:border-brand-300">
        <Icon icon={Search01Icon} className="shrink-0 text-ink-600" />
        <input
          id={id}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm leading-[1.4] font-medium text-ink-900 outline-none placeholder:text-ink-600"
        />
      </label>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`flex h-11 items-center gap-2 rounded-[40px] border bg-white px-5 text-sm leading-[1.2] font-medium text-ink-800 ${active ? 'border-brand-300' : 'border-ink-200'}`}
        >
          <Icon icon={FilterHorizontalIcon} size={18} />
          {active ? options.find((o) => o.value === selected)?.label : 'Filter'}
          <Icon icon={ArrowDown01Icon} size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <ul className="pop-in absolute top-[52px] right-0 z-20 flex w-48 flex-col rounded-2xl border border-ink-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(35,40,40,0.12)]">
            {options.map((o) => (
              <li key={o.value}>
                <button
                  onClick={() => {
                    onSelect(o.value)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-800 hover:bg-ink-100"
                >
                  {o.label}
                  {o.value === selected && <Icon icon={Tick02Icon} size={16} className="text-brand-500" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
