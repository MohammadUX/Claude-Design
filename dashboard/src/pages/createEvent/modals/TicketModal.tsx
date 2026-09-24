import { Ticket02Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { uid, type Ticket } from '../model'
import { DialogShell, ErrorText, FieldLabel, Radio, SubmitButton, TextInput } from '../ui'

const dotColors = ['#6d5bd0', '#f59e0b', '#16a34a', '#e5484d', '#2563eb']

export default function TicketModal({ editing, index, onClose, onSave }: { editing?: Ticket; index: number; onClose: () => void; onSave: (t: Ticket) => void }) {
  const [name, setName] = useState(editing?.name ?? (index === 0 ? 'General Admission' : ''))
  const [qty, setQty] = useState(String(editing?.qty ?? 150))
  const [kind, setKind] = useState<Ticket['kind']>(editing?.kind ?? 'Single')
  const [groupSize, setGroupSize] = useState(String(editing?.groupSize ?? 4))
  const [paid, setPaid] = useState(editing?.paid ?? true)
  const [price, setPrice] = useState(editing?.paid ? String(editing.price) : '')
  const [discount, setDiscount] = useState(editing?.discountPrice ? String(editing.discountPrice) : '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [tried, setTried] = useState(false)

  const qtyN = Number(qty)
  const priceN = Number(price)
  const discountN = discount ? Number(discount) : undefined
  const errors = {
    name: !name.trim() && 'Give the ticket a name, like "General Admission".',
    qty: (!Number.isInteger(qtyN) || qtyN < 1) && 'Enter how many tickets are available (at least 1).',
    group: kind === 'Group' && (!Number.isInteger(Number(groupSize)) || Number(groupSize) < 2) && 'A group ticket covers at least 2 people.',
    price: paid && (!(priceN > 0) ? 'Enter a price above $0, or make the ticket free.' : false),
    discount: paid && discountN !== undefined && (!(discountN > 0) || discountN >= priceN) && 'The discounted price must be lower than the price.',
  }
  const valid = !Object.values(errors).some(Boolean)

  const save = () => {
    setTried(true)
    if (!valid) return
    const ticket: Ticket = {
      id: editing?.id ?? uid(),
      name: name.trim(),
      qty: qtyN,
      kind,
      groupSize: Number(groupSize),
      paid,
      price: paid ? priceN : 0,
      discountPrice: paid ? discountN : undefined,
      description: description.trim(),
      color: editing?.color ?? dotColors[index % dotColors.length],
    }
    return () => onSave(ticket)
  }

  const err = (e: string | false) => tried && e && <ErrorText>{e}</ErrorText>

  return (
    <DialogShell icon={Ticket02Icon} title={editing ? 'Edit ticket' : 'Add ticket'} onClose={onClose} footer={<><span /><SubmitButton onSubmit={save}>Save</SubmitButton></>}>
      <div className="flex flex-col gap-5 rounded-2xl bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="t-name">Ticket name</FieldLabel>
            <TextInput id="t-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="General Admission" invalid={tried && !!errors.name} />
            {err(errors.name)}
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="t-qty">Quantity</FieldLabel>
            <TextInput id="t-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} invalid={tried && !!errors.qty} />
          </div>
        </div>
        {err(errors.qty)}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-800">Ticket type</span>
          <div className="flex flex-wrap items-center gap-3">
            <div role="radiogroup" className="flex w-fit rounded-full bg-ink-100 p-1">
              {(['Single', 'Group'] as const).map((k) => (
                <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`rounded-full px-8 py-1.5 text-sm font-medium ${kind === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-700'}`}>
                  {k}
                </button>
              ))}
            </div>
            {kind === 'Group' && (
              <label className="flex items-center gap-2 text-sm text-ink-800">
                People per ticket
                <TextInput id="t-group" inputMode="numeric" value={groupSize} onChange={(e) => setGroupSize(e.target.value.replace(/\D/g, ''))} className="h-9 w-16 text-center" invalid={tried && !!errors.group} />
              </label>
            )}
          </div>
          {err(errors.group)}
        </div>

        <div role="radiogroup" className="flex items-center gap-6">
          <Radio size="sm" checked={paid} onChange={() => setPaid(true)}>
            Paid
          </Radio>
          <Radio size="sm" checked={!paid} onChange={() => setPaid(false)}>
            Free
          </Radio>
        </div>

        {paid && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="t-price">Price (USD)</FieldLabel>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-ink-700">$</span>
                <TextInput id="t-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} placeholder="50.00" className="pl-8" invalid={tried && !!errors.price} />
              </div>
              {err(errors.price)}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="t-discount" optional>
                Discounted price
              </FieldLabel>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-ink-700">$</span>
                <TextInput id="t-discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="40.00" className="pl-8" invalid={tried && !!errors.discount} />
              </div>
              {err(errors.discount)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="t-desc" optional>
            Description
          </FieldLabel>
          <textarea
            id="t-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's included with this ticket?"
            className="w-full resize-none rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none placeholder:text-ink-600 focus:border-brand-300"
          />
        </div>
      </div>
    </DialogShell>
  )
}
