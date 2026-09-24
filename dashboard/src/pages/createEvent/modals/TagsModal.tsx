import { Cancel01Icon, HashtagIcon, Tag01Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Icon from '../../../components/Icon'
import { DialogShell, ErrorText, SubmitButton } from '../ui'

const suggestions = ['Design', 'Product', 'Startup', 'Career', 'AI', 'Marketing', 'Leadership', 'Finance']
const MAX = 6

export default function TagsModal({ tags: initial, onClose, onSave }: { tags: string[]; onClose: () => void; onSave: (tags: string[]) => void }) {
  const [tags, setTags] = useState(initial)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const add = (raw: string) => {
    const tag = raw.replace(/^#/, '').trim()
    if (!tag) return
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return setError(`"${tag}" is already added.`)
    if (tags.length >= MAX) return setError(`You can add up to ${MAX} tags.`)
    setTags([...tags, tag.slice(0, 24)])
    setValue('')
    setError('')
  }

  return (
    <DialogShell icon={HashtagIcon} title="Add tag" width="max-w-[560px]" onClose={onClose} footer={<><span /><SubmitButton onSubmit={() => () => onSave(value.trim() ? [...tags, value.trim()] : tags)}>Save</SubmitButton></>}>
      <div className="flex flex-col gap-2">
        <label htmlFor="tag-input" className="text-sm font-medium text-ink-800">
          Tags <span className="font-normal text-ink-600">· press Enter to add</span>
        </label>
        <div className="flex h-12 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 focus-within:border-brand-300">
          <Icon icon={Tag01Icon} size={18} className="text-ink-700" />
          <input
            id="tag-input"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                add(value)
              } else if (e.key === 'Backspace' && !value && tags.length) setTags(tags.slice(0, -1))
            }}
            placeholder="Add a tag..."
            className="min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-600"
          />
        </div>
        {error && <ErrorText>{error}</ErrorText>}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1.5 pr-2 pl-3 text-[13px] font-medium text-ink-900">
              <Icon icon={HashtagIcon} size={14} />
              {t}
              <button aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))} className="flex rounded-full p-0.5 text-ink-700 hover:bg-ink-100">
                <Icon icon={Cancel01Icon} size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-600">Suggested:</span>
        {suggestions
          .filter((s) => !tags.includes(s))
          .slice(0, 5)
          .map((s) => (
            <button key={s} onClick={() => add(s)} className="rounded-full border border-dashed border-ink-600/40 px-2.5 py-1 text-xs font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700">
              + {s}
            </button>
          ))}
      </div>
    </DialogShell>
  )
}
