import { Layers01Icon, Search01Icon, Tick02Icon, Upload01Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/Icon'
import { pickColor, readImage, uid, type SponsorEntry, type Tier } from '../model'
import { sponsorLibrary, tierOptions } from '../options'
import { DialogShell, Dropdown, ErrorText, FieldLabel, PrimaryButton, TextInput } from '../ui'


export function NewSponsorModal({ editing, onClose, onSave }: { editing?: SponsorEntry; onClose: () => void; onSave: (s: SponsorEntry) => void }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [website, setWebsite] = useState(editing?.website ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [tier, setTier] = useState<Tier>(editing?.tier ?? 'gold')
  const [logo, setLogo] = useState(editing?.logo)
  const [tried, setTried] = useState(false)
  const cleanSite = website.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const siteOk = /^[\w-]+(\.[\w-]+)+/.test(cleanSite)
  const valid = name.trim() && siteOk

  return (
    <DialogShell
      icon={Layers01Icon}
      title={editing ? 'Edit sponsor' : 'Add sponsor'}
      onClose={onClose}
      footer={
        <>
          <span />
          <PrimaryButton
            onClick={() => {
              setTried(true)
              if (valid) onSave({ id: editing?.id ?? uid(), name: name.trim(), website: cleanSite, email: email.trim() || undefined, tier, logo, color: editing?.color ?? pickColor(name) })
            }}
          >
            {editing ? 'Save changes' : 'Add sponsor'}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-6 rounded-2xl bg-white p-5 sm:grid-cols-[1fr_200px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-company">Company name</FieldLabel>
            <TextInput id="sp-company" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltd." invalid={tried && !name.trim()} />
            {tried && !name.trim() && <ErrorText>Add the sponsor's name.</ErrorText>}
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-site">Website</FieldLabel>
            <TextInput id="sp-site" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.website.com" invalid={tried && !siteOk} />
            {tried && !siteOk && <ErrorText>Enter a website like www.acme.com.</ErrorText>}
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-mail" optional>
              Contact email
            </FieldLabel>
            <TextInput id="sp-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partners@acme.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-800">Tier</span>
            <Dropdown value={tier} options={tierOptions} onChange={setTier} className="h-11 w-full justify-between rounded-xl border-ink-200 bg-white px-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-800">Upload logo</span>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-600/40 px-4 py-3 hover:border-brand-300">
              <span className="flex size-9 items-center justify-center rounded-lg bg-ink-100 text-ink-800">
                <Icon icon={Upload01Icon} size={18} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink-900">{logo ? 'Change logo' : 'Choose a file or drag and drop here'}</span>
                <span className="text-xs text-ink-600">JPEG or PNG, square works best</span>
              </span>
              <input id="sp-logo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => e.target.files?.[0] && setLogo(await readImage(e.target.files[0]))} />
            </label>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-dashed border-ink-200 pt-5 text-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <span className="text-xs font-medium text-ink-600">Preview</span>
          <Avatar name={name || 'Sponsor'} color={pickColor(name || 'x')} size={96} src={logo} className="mt-2" />
          <p className="mt-2 text-lg leading-[1.3] font-semibold text-ink-900">{name || 'Company name'}</p>
          <p className="text-sm text-ink-700">{cleanSite || 'www.website.com'}</p>
        </div>
      </div>
    </DialogShell>
  )
}

export function LibraryModal({ existing, onClose, onAdd }: { existing: SponsorEntry[]; onClose: () => void; onAdd: (s: SponsorEntry[]) => void }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [tier, setTier] = useState<Tier>('silver')
  const list = sponsorLibrary.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
  const already = (n: string) => existing.some((e) => e.name === n)

  return (
    <DialogShell
      icon={Layers01Icon}
      title="Choose from saved library"
      onClose={onClose}
      width="max-w-[760px]"
      footer={
        <>
          <span className="text-sm text-ink-700">{picked.length ? `${picked.length} selected` : 'Select one or more sponsors'}</span>
          <PrimaryButton
            disabled={!picked.length}
            onClick={() => onAdd(sponsorLibrary.filter((s) => picked.includes(s.name)).map((s) => ({ id: uid(), name: s.name, website: s.website, email: s.email, tier, color: s.color })))}
          >
            Add sponsor{picked.length > 1 ? 's' : ''}
          </PrimaryButton>
        </>
      }
    >
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-ink-200 bg-white px-4 focus-within:border-brand-300">
        <Icon icon={Search01Icon} size={20} className="text-ink-700" />
        <input id="lib-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by sponsor name" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600" />
      </label>
      <div className="flex min-h-[260px] flex-col gap-4 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink-800">Sponsors from past events</h3>
          {picked.length > 0 && (
            <Dropdown value={tier} options={tierOptions.map((t) => ({ ...t, label: `${t.label} tier` }))} onChange={setTier} size="sm" menuAlign="right" className="border-ink-200" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {list.map((s) => {
            const on = picked.includes(s.name)
            const added = already(s.name)
            return (
              <button
                key={s.name}
                disabled={added}
                aria-pressed={on}
                onClick={() => setPicked(on ? picked.filter((p) => p !== s.name) : [...picked, s.name])}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-4 text-center transition-colors disabled:opacity-50 ${on ? 'border-brand-500' : 'border-ink-200 hover:border-ink-600/40'}`}
              >
                {on && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Icon icon={Tick02Icon} size={12} />
                  </span>
                )}
                <Avatar name={s.name} color={s.color} size={36} />
                <span className="mt-1 text-sm font-medium text-ink-900">{s.name}</span>
                <span className="text-xs text-ink-600">{added ? 'Already added' : s.website}</span>
              </button>
            )
          })}
        </div>
      </div>
    </DialogShell>
  )
}
