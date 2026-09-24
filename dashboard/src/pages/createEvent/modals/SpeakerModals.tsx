import { ArrowLeft02Icon, Mic01Icon, Search01Icon, StarIcon, Upload01Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/Icon'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { pickColor, readImage, uid, type Speaker } from '../model'
import { experts } from '../options'
import { DialogShell, ErrorText, FieldLabel, PrimaryButton, TextInput } from '../ui'

export type SpeakerFlow = { step: 'choose' } | { step: 'find' } | { step: 'form'; editing?: Speaker }

type Props = {
  flow: SpeakerFlow
  added: Speaker[]
  onFlow: (f: SpeakerFlow | null) => void
  onSave: (s: Speaker) => void
}

export default function SpeakerModals({ flow, added, onFlow, onSave }: Props) {
  if (flow.step === 'choose') return <ChooseModal onClose={() => onFlow(null)} onPick={(s) => onFlow({ step: s })} />
  if (flow.step === 'find') return <FindModal added={added} onBack={() => onFlow({ step: 'choose' })} onClose={() => onFlow(null)} onAdd={onSave} />
  return <BackupModal editing={flow.editing} onBack={flow.editing ? undefined : () => onFlow({ step: 'choose' })} onClose={() => onFlow(null)} onSave={onSave} />
}

function ChooseModal({ onClose, onPick }: { onClose: () => void; onPick: (s: 'find' | 'form') => void }) {
  const [pick, setPick] = useState<'find' | 'form'>('find')
  return (
    <DialogShell icon={Mic01Icon} title="Add speaker" width="max-w-[560px]" onClose={onClose} footer={<><span /><PrimaryButton onClick={() => onPick(pick)}>Continue</PrimaryButton></>}>
      <p className="text-base leading-[1.4] font-medium text-ink-900">How would you like to add a speaker?</p>
      <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { id: 'find', title: 'Find expert on PAAQ', hint: '40k+ experts available on PAAQ. They can answer questions live.' },
            { id: 'form', title: 'Create backup profile', hint: "Enter the speaker's details yourself. They won't be able to answer questions." },
          ] as const
        ).map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={pick === o.id}
            onClick={() => setPick(o.id)}
            onDoubleClick={() => onPick(o.id)}
            className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-1.5 pb-4 text-left ${pick === o.id ? 'border-brand-500' : 'border-transparent hover:border-ink-200'}`}
          >
            <span className="flex h-[88px] items-center justify-center gap-[-6px] rounded-xl bg-ink-200/70">
              {o.id === 'find' ? (
                experts.slice(0, 5).map((e, i) => <Avatar key={e.id} name={e.name} color={e.color} size={i === 2 ? 44 : 30} plain className={`border-2 border-white ${i ? '-ml-2' : ''}`} />)
              ) : (
                <span className="flex w-[70%] items-center gap-2 rounded-lg bg-white p-2">
                  <Avatar name="New" color="#6b7373" size={22} plain />
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="h-1.5 w-3/4 rounded bg-ink-200" />
                    <span className="h-1.5 w-1/2 rounded bg-ink-200" />
                  </span>
                </span>
              )}
            </span>
            <span className="flex flex-col gap-1 px-2">
              <span className="text-base leading-[1.4] font-semibold text-ink-900">{o.title}</span>
              <span className="text-sm leading-[1.4] font-medium text-ink-700">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </DialogShell>
  )
}

function FindModal({ added, onBack, onClose, onAdd }: { added: Speaker[]; onBack: () => void; onClose: () => void; onAdd: (s: Speaker) => void }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const match = experts.filter((e) => !query || `${e.name} ${e.title}`.toLowerCase().includes(query))
  const isAdded = (name: string) => added.some((s) => s.name === name)
  const groups = [
    { title: 'Spoke on your events', list: match.filter((e) => e.spokeBefore) },
    { title: 'Top experts on PAAQ', list: match.filter((e) => !e.spokeBefore) },
  ].filter((g) => g.list.length)

  return (
    <DialogShell
      title="Find expert on PAAQ"
      onClose={onClose}
      header={
        <button onClick={onBack} className="flex items-center gap-2 text-base font-medium text-ink-900">
          <span className="flex size-9 items-center justify-center rounded-full border border-ink-600/40">
            <Icon icon={ArrowLeft02Icon} size={18} />
          </span>
          Back
        </button>
      }
    >
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-ink-200 bg-white px-4 focus-within:border-brand-300">
        <Icon icon={Search01Icon} size={20} className="text-ink-700" />
        <input id="find-expert" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or expertise..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-600" />
      </label>
      <div className="flex min-h-[300px] flex-col gap-5 rounded-2xl bg-white p-4">
        {groups.length === 0 && <p className="py-10 text-center text-sm text-ink-600">No experts match "{q.trim()}". Try another name, or create a backup profile.</p>}
        {groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-800">{g.title}</h3>
            {g.list.map((e) => {
              const done = isAdded(e.name)
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 p-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} color={e.color} size={40} />
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 text-base leading-[1.4] font-medium text-ink-900">
                        {e.name}
                        <VerifiedBadge size={16} />
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
                        {e.title}
                        <span className="flex items-center gap-0.5 text-ink-900">
                          · <Icon icon={StarIcon} size={12} className="text-amber-500 [&_path]:fill-current" /> {e.rating}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={done}
                    onClick={() => onAdd({ id: uid(), name: e.name, title: e.title, color: e.color, source: 'paaq', verified: true })}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${done ? 'bg-brand-100 text-brand-700' : 'bg-brand-500 text-white hover:brightness-95'}`}
                  >
                    {done ? 'Added' : 'Add'}
                  </button>
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </DialogShell>
  )
}

function BackupModal({ editing, onBack, onClose, onSave }: { editing?: Speaker; onBack?: () => void; onClose: () => void; onSave: (s: Speaker) => void }) {
  const [name, setName] = useState(editing?.name ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [about, setAbout] = useState(editing?.about ?? '')
  const [photo, setPhoto] = useState(editing?.photo)
  const [tried, setTried] = useState(false)
  const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const valid = name.trim() && title.trim() && emailOk
  const readonlyPaaq = editing?.source === 'paaq'

  const save = () => {
    setTried(true)
    if (!valid) return
    onSave({
      id: editing?.id ?? uid(),
      name: name.trim(),
      email: email.trim() || undefined,
      title: title.trim(),
      about: about.trim() || undefined,
      photo,
      color: editing?.color ?? pickColor(name),
      source: editing?.source ?? 'backup',
      verified: editing?.verified,
    })
  }

  return (
    <DialogShell
      icon={Mic01Icon}
      title={editing ? 'Edit speaker' : 'Add speaker'}
      onClose={onClose}
      footer={
        <>
          {onBack ? (
            <button onClick={onBack} className="flex items-center gap-2 text-base font-medium text-ink-700 hover:text-ink-900">
              <Icon icon={ArrowLeft02Icon} size={18} />
              Back
            </button>
          ) : (
            <span />
          )}
          <PrimaryButton onClick={save}>{editing ? 'Save changes' : 'Add speaker'}</PrimaryButton>
        </>
      }
    >
      <div className="grid gap-6 rounded-2xl bg-white p-5 sm:grid-cols-[1fr_200px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-name">Full name</FieldLabel>
            <TextInput id="sp-name" autoFocus={!editing} disabled={readonlyPaaq} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" invalid={tried && !name.trim()} />
            {tried && !name.trim() && <ErrorText>Add the speaker's name.</ErrorText>}
          </div>
          {!readonlyPaaq && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="sp-email" optional>
                Email
              </FieldLabel>
              <TextInput id="sp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" invalid={tried && !emailOk} />
              {tried && !emailOk && <ErrorText>Enter a valid email, like name@example.com.</ErrorText>}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-title">Title</FieldLabel>
            <TextInput id="sp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Project manager" invalid={tried && !title.trim()} />
            {tried && !title.trim() && <ErrorText>Add a title so guests know who's speaking.</ErrorText>}
          </div>
          {!readonlyPaaq && (
            <>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="sp-about" optional>
                  About speaker
                </FieldLabel>
                <textarea
                  id="sp-about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Write about the speaker"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-ink-200 px-4 py-3 text-sm outline-none placeholder:text-ink-600 focus:border-brand-300"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-800">Upload photo</span>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink-600/40 px-4 py-3 hover:border-brand-300">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-ink-100 text-ink-800">
                    <Icon icon={Upload01Icon} size={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-ink-900">{photo ? 'Change photo' : 'Choose a file or drag and drop here'}</span>
                    <span className="text-xs text-ink-600">JPEG or PNG</span>
                  </span>
                  <input id="sp-photo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => e.target.files?.[0] && setPhoto(await readImage(e.target.files[0]))} />
                </label>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-dashed border-ink-200 pt-5 text-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <span className="text-xs font-medium text-ink-600">Preview</span>
          <Avatar name={name || 'Speaker'} color={editing?.color ?? pickColor(name || 'x')} size={96} src={photo} className="mt-2" />
          <p className="mt-2 text-lg leading-[1.3] font-semibold text-ink-900">{name || 'Full name'}</p>
          <p className="text-sm text-ink-700">{title || 'Title'}</p>
        </div>
      </div>
    </DialogShell>
  )
}
