import { Delete02Icon, Edit04Icon, Layers01Icon, PlusSignIcon, Presentation01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useRef, useState } from 'react'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/Icon'
import type { Draft, SponsorEntry, Tier } from '../model'
import { tierOptions } from '../options'
import { Dropdown, panel, SectionTitle } from '../ui'

type Props = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  onNew: () => void
  onEdit: (s: SponsorEntry) => void
  onLibrary: () => void
}

export default function SponsorsStep({ draft, set, onNew, onEdit, onLibrary }: Props) {
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle icon={Presentation01Icon} right={<span className="text-sm text-ink-700">Optional</span>}>
        Sponsors
      </SectionTitle>
      <div className={`${panel} divide-y divide-ink-200`}>
        <div ref={ref} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="flex w-full items-center gap-2 rounded-t-xl px-4 py-3.5 text-left text-base text-ink-900 hover:bg-white">
            <Icon icon={PlusSignIcon} size={20} />
            Add sponsor
          </button>
          {menu && (
            <div className="pop-in absolute top-full left-2 z-30 mt-1 flex w-[300px] flex-col rounded-xl border border-ink-200 bg-white p-1 shadow-[0_12px_32px_rgba(35,40,40,0.12)]">
              <button onClick={() => (setMenu(false), onNew())} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900 hover:bg-ink-100">
                <Icon icon={PlusSignIcon} size={18} />
                Add new sponsor
              </button>
              <button onClick={() => (setMenu(false), onLibrary())} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900 hover:bg-ink-100">
                <Icon icon={Layers01Icon} size={18} />
                Choose from saved library
                <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">Plus Events</span>
              </button>
            </div>
          )}
        </div>
        {draft.sponsors.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={s.name} color={s.color} size={36} src={s.logo} />
              <div className="flex min-w-0 flex-col">
                <span className="text-sm leading-[1.4] font-medium text-ink-900">{s.name}</span>
                <span className="truncate text-xs leading-[1.4] text-ink-700">{[s.email, s.website].filter(Boolean).join('  ·  ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Dropdown
                value={s.tier}
                options={tierOptions}
                onChange={(tier: Tier) => set({ sponsors: draft.sponsors.map((x) => (x.id === s.id ? { ...x, tier } : x)) })}
                size="sm"
                menuAlign="right"
                className="border-ink-200 bg-white"
              />
              <button aria-label={`Edit ${s.name}`} onClick={() => onEdit(s)} className="flex size-8 items-center justify-center rounded-lg text-ink-800 hover:bg-ink-100">
                <Icon icon={Edit04Icon} size={18} />
              </button>
              <button aria-label={`Remove ${s.name}`} onClick={() => set({ sponsors: draft.sponsors.filter((x) => x.id !== s.id) })} className="flex size-8 items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10">
                <Icon icon={Delete02Icon} size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink-700">Sponsors appear on your event page, grouped by tier. You can skip this step.</p>
    </div>
  )
}
