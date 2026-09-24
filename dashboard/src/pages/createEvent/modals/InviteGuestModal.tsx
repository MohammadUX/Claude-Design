import { Delete02Icon, InternetIcon, PlusSignIcon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/Icon'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { pickColor, uid, type Guest, type GuestRole } from '../model'
import { members } from '../options'
import { DialogShell, Dropdown, ErrorText, InfoTip, PrimaryButton } from '../ui'

const roles: { value: GuestRole; label: string; hint: string }[] = [
  { value: 'Admin', label: 'Admin', hint: 'Can edit the event and manage guests' },
  { value: 'Moderator', label: 'Moderator', hint: 'Can moderate chat and Q&A' },
  { value: 'Guest', label: 'Guest', hint: 'Joins for free, no extra permissions' },
]

export default function InviteGuestModal({ guests: initial, onClose, onSave }: { guests: Guest[]; onClose: () => void; onSave: (g: Guest[]) => void }) {
  const [guests, setGuests] = useState(initial)
  const [q, setQ] = useState('')
  const [role, setRole] = useState<GuestRole>('Moderator')
  const [error, setError] = useState('')
  const query = q.trim().toLowerCase()
  const matches = query ? members.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(query) && !guests.some((g) => g.email === m.email)).slice(0, 4) : []

  const add = (person?: { name: string; email: string; verified?: boolean }) => {
    const target = person ?? members.find((m) => m.email.toLowerCase() === query || m.name.toLowerCase() === query)
    const email = target?.email ?? q.trim()
    if (!target && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Pick someone from PAAQ or enter a full email address.')
    if (guests.some((g) => g.email.toLowerCase() === email.toLowerCase())) return setError('That person is already on your team.')
    const name = target?.name ?? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setGuests([...guests, { id: uid(), name, email, role, color: pickColor(name), verified: target?.verified }])
    setQ('')
    setError('')
  }

  return (
    <DialogShell icon={UserAdd01Icon} title="Invite guest" onClose={onClose} footer={<><span /><PrimaryButton onClick={() => onSave(guests)}>Save</PrimaryButton></>}>
      <div className="flex flex-col gap-5 rounded-2xl bg-white p-5">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1 text-sm font-medium text-ink-900">
            Search on PAAQ <InfoTip text="Team members get free access. Admins can edit the event; moderators run chat and Q&A." />
          </span>
          <div className="flex gap-2">
            <div className="relative flex h-12 min-w-0 flex-1 items-center rounded-full border border-ink-200 pr-1.5 pl-4 focus-within:border-brand-300">
              <input
                id="guest-search"
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
                placeholder="Name, @username or email"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600"
              />
              <Dropdown value={role} options={roles} onChange={setRole} icon={InternetIcon} size="sm" menuAlign="right" className="border-ink-200" />
              {matches.length > 0 && (
                <ul className="absolute top-full left-0 z-20 mt-1 w-full rounded-xl border border-ink-200 bg-white p-1 shadow-lg">
                  {matches.map((m) => (
                    <li key={m.email}>
                      <button onClick={() => add(m)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-ink-100">
                        <Avatar name={m.name} color={pickColor(m.name)} size={28} />
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-ink-900">{m.name}</span>
                          <span className="text-xs text-ink-600">{m.email}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => add()} className="flex h-12 items-center gap-1.5 rounded-full border border-ink-200 bg-ink-100 px-5 text-sm font-medium text-ink-900 hover:bg-ink-200">
              <Icon icon={PlusSignIcon} size={18} />
              Invite
            </button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-ink-900">Added members</span>
          {guests.length === 0 && <p className="text-sm text-ink-600">No one yet. Invite co-hosts, moderators or free guests.</p>}
          {guests.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={g.name} color={g.color} size={36} />
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1 truncate text-sm font-medium text-ink-900">
                    {g.name} {g.verified && <VerifiedBadge size={16} />}
                  </span>
                  <span className="truncate text-xs text-ink-600">{g.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dropdown value={g.role} options={roles} onChange={(r) => setGuests(guests.map((x) => (x.id === g.id ? { ...x, role: r } : x)))} size="sm" menuAlign="right" className="border-ink-200 bg-ink-100" />
                <button aria-label={`Remove ${g.name}`} onClick={() => setGuests(guests.filter((x) => x.id !== g.id))} className="flex size-8 items-center justify-center rounded-full text-danger-500 hover:bg-danger-500/10">
                  <Icon icon={Delete02Icon} size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DialogShell>
  )
}
