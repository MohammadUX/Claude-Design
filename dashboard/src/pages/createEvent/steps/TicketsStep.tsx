import { Calendar03Icon, Delete02Icon, Edit04Icon, InformationCircleIcon, MinusSignIcon, PlusSignIcon, SlidersHorizontalIcon, Ticket02Icon } from '@hugeicons/core-free-icons'
import Icon from '../../../components/Icon'
import { mediumDate } from '../dates'
import type { Draft, Ticket } from '../model'
import { ErrorText, panel, SectionTitle, Toggle } from '../ui'

export type TicketErrors = Partial<Record<'sales' | 'max', string>>

type Props = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  errors: TicketErrors
  onAdd: () => void
  onEdit: (t: Ticket) => void
  onUpgrade: () => void
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`

export default function TicketsStep({ draft, set, errors, onAdd, onEdit, onUpgrade }: Props) {
  const limitReached = !draft.plusPlan && draft.tickets.length >= 1
  const salePeriod = draft.limitSales ? `${mediumDate(draft.salesStart).replace(/, \d{4}$/, '')} – ${mediumDate(draft.salesEnd)}` : `Until ${mediumDate(draft.start.date)}`
  const updateTicket = (id: string, patch: Partial<Ticket>) => set({ tickets: draft.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle icon={Ticket02Icon}>Ticket</SectionTitle>
        <div className={`${panel} divide-y divide-ink-200`}>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <button onClick={onAdd} disabled={limitReached} className="flex items-center gap-2 text-base text-ink-900 disabled:text-ink-600">
              <Icon icon={PlusSignIcon} size={20} />
              Add ticket
            </button>
            {limitReached && (
              <span className="flex items-center gap-2 text-sm text-ink-800">
                Free includes 1 ticket type
                <button onClick={onUpgrade} className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:brightness-95">
                  Upgrade
                </button>
              </span>
            )}
          </div>
          {draft.tickets.length === 0 && (
            <p className="px-4 py-3.5 text-sm text-ink-700">No tickets yet. Without a ticket, people register for free with one click.</p>
          )}
          {draft.tickets.map((t) => (
            <div key={t.id} className="flex flex-col gap-3 px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-base font-medium text-ink-900">
                  <span className="size-2 rounded-full" style={{ background: t.color }} />
                  {t.name}
                </span>
                <span className="flex items-center gap-1">
                  <button aria-label={`Edit ${t.name}`} onClick={() => onEdit(t)} className="flex size-8 items-center justify-center rounded-lg text-ink-800 hover:bg-ink-100">
                    <Icon icon={Edit04Icon} size={18} />
                  </button>
                  <button aria-label={`Remove ${t.name}`} onClick={() => set({ tickets: draft.tickets.filter((x) => x.id !== t.id) })} className="flex size-8 items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10">
                    <Icon icon={Delete02Icon} size={18} />
                  </button>
                </span>
              </div>
              <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-ink-700">Price</span>
                  <span className="flex items-baseline gap-1.5 text-lg font-semibold text-ink-900 tabular-nums">
                    {!t.paid ? 'Free' : money(t.discountPrice ?? t.price)}
                    {t.paid && t.discountPrice !== undefined && <span className="text-xs font-medium text-ink-600 line-through">{money(t.price)}</span>}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-ink-700">Qty available</span>
                  <span className="flex w-fit items-center gap-1 rounded-lg border border-ink-200 bg-white">
                    <button aria-label="Fewer" onClick={() => updateTicket(t.id, { qty: Math.max(1, t.qty - 10) })} className="flex size-7 items-center justify-center text-ink-700 hover:text-ink-900">
                      <Icon icon={MinusSignIcon} size={14} />
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium tabular-nums">{t.qty}</span>
                    <button aria-label="More" onClick={() => updateTicket(t.id, { qty: t.qty + 10 })} className="flex size-7 items-center justify-center text-ink-700 hover:text-ink-900">
                      <Icon icon={PlusSignIcon} size={14} />
                    </button>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-ink-700">Sale period</span>
                  <span className="text-sm font-medium text-ink-900">{salePeriod}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>{t.paid ? 'Paid' : 'Free'}</span>
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-800">{t.kind === 'Group' ? `Group of ${t.groupSize}` : 'Single'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle icon={SlidersHorizontalIcon}>Ticket preference</SectionTitle>
        <div className={`${panel} divide-y divide-ink-200`}>
          <div className="flex flex-col gap-3 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-base text-ink-900">Limit sales period</span>
              <Toggle label="Limit sales period" checked={draft.limitSales} onChange={(v) => set({ limitSales: v })} />
            </div>
            {draft.limitSales && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(['salesStart', 'salesEnd'] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-1.5 text-sm text-ink-800">
                    {k === 'salesStart' ? 'Sale start date' : 'Sale end date'}
                    <span className={`flex h-11 items-center gap-2 rounded-xl border bg-white px-3 ${errors.sales ? 'border-danger-500' : 'border-ink-200'}`}>
                      <Icon icon={Calendar03Icon} size={18} className="text-ink-700" />
                      <input id={k} type="date" value={draft[k]} max={draft.start.date} onChange={(e) => set({ [k]: e.target.value } as Partial<Draft>)} className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink-900 outline-none" />
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.sales && <ErrorText>{errors.sales}</ErrorText>}
          </div>
          <div className="flex flex-col gap-3 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-base text-ink-900">Limit purchase quantity</span>
              <Toggle label="Limit purchase quantity" checked={draft.limitQty} onChange={(v) => set({ limitQty: v })} />
            </div>
            {draft.limitQty && (
              <label className="flex flex-col gap-1.5 text-sm text-ink-800">
                Max per person
                <input
                  id="max-per-person"
                  inputMode="numeric"
                  value={draft.maxPerPerson || ''}
                  onChange={(e) => set({ maxPerPerson: Number(e.target.value.replace(/\D/g, '')) })}
                  className={`h-11 rounded-xl border bg-white px-4 text-sm font-medium text-ink-900 outline-none focus:border-brand-300 ${errors.max ? 'border-danger-500' : 'border-ink-200'}`}
                />
              </label>
            )}
            {errors.max && <ErrorText>{errors.max}</ErrorText>}
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-800">
          <Icon icon={InformationCircleIcon} size={16} />
          {draft.plusPlan ? 'Plus Events: 4% fee on paid tickets.' : '7% fee on paid tickets. Drop to 4% with Plus Events.'}
        </p>
      </div>
    </div>
  )
}
