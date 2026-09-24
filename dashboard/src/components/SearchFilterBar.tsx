import { ArrowDown01Icon, FilterHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import { categories } from '../data/mock'
import Icon from './Icon'

export type PriceFilter = 'all' | 'free' | 'paid'

type SearchFilterBarProps = {
  query: string
  onQueryChange: (q: string) => void
  price: PriceFilter
  onPriceChange: (p: PriceFilter) => void
  categoryId: string | null
  onCategoryChange: (id: string | null) => void
}

const priceOptions: { value: PriceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

export default function SearchFilterBar(props: SearchFilterBarProps) {
  const { query, onQueryChange, price, onPriceChange, categoryId, onCategoryChange } = props
  const [open, setOpen] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const activeCount = (price !== 'all' ? 1 : 0) + (categoryId ? 1 : 0)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const chip = (selected: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 text-ink-800 hover:border-brand-300'
    }`

  return (
    <div className="flex h-11 w-full max-w-[648px] items-center gap-2">
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[40px] border border-ink-200 bg-white px-5 focus-within:border-brand-300">
        <Icon icon={Search01Icon} className="shrink-0 text-ink-600" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, date, session"
          className="min-w-0 flex-1 bg-transparent text-sm leading-[1.4] font-medium text-ink-900 outline-none placeholder:text-ink-600"
        />
      </label>

      <div ref={popRef} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-11 items-center gap-2 rounded-[40px] border border-ink-200 bg-white px-5 text-sm leading-[1.2] font-medium text-ink-800 hover:border-brand-300"
        >
          <Icon icon={FilterHorizontalIcon} size={18} />
          Filter
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-500 text-[11px] text-white">{activeCount}</span>
          )}
          <Icon icon={ArrowDown01Icon} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-[52px] right-0 z-20 flex w-[320px] flex-col gap-5 rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_12px_32px_rgba(35,40,40,0.12)]">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink-900">Price</p>
              <div className="flex flex-wrap gap-2">
                {priceOptions.map((o) => (
                  <button key={o.value} className={chip(price === o.value)} onClick={() => onPriceChange(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink-900">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c.id} className={chip(categoryId === c.id)} onClick={() => onCategoryChange(categoryId === c.id ? null : c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-4">
              <button
                className="text-sm font-medium text-ink-700 hover:text-ink-900"
                onClick={() => {
                  onPriceChange('all')
                  onCategoryChange(null)
                }}
              >
                Clear all
              </button>
              <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white" onClick={() => setOpen(false)}>
                Show results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
