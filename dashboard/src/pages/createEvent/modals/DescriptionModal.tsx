import {
  AiMagicIcon,
  Link01Icon,
  NoteEditIcon,
  TextBoldIcon,
  TextIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  LeftToRightListBulletIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useRef, useState } from 'react'
import Icon from '../../../components/Icon'
import { DialogShell, SubmitButton } from '../ui'

const tools: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'heading', label: 'Heading', icon: TextIcon },
  { id: 'bold', label: 'Bold', icon: TextBoldIcon },
  { id: 'underline', label: 'Underline', icon: TextUnderlineIcon },
  { id: 'italic', label: 'Italic', icon: TextItalicIcon },
  { id: 'list', label: 'Bullet list', icon: LeftToRightListBulletIcon },
  { id: 'link', label: 'Add link', icon: Link01Icon },
]

type Props = { html: string; title: string; type: string | null; onClose: () => void; onSave: (html: string) => void }

function suggestion(title: string, type: string | null) {
  const name = title.trim() || 'this session'
  const kind = (type ?? 'event').toLowerCase()
  return `<h3>What you'll learn</h3><p>${name} is a practical ${kind} for people who want to move from ideas to real results. We'll walk through the thinking, show real examples, and leave time for your questions.</p><ul><li>The core framework, explained with real examples</li><li>Common mistakes and how to avoid them</li><li>A simple plan you can use the next day</li></ul>`
}

/** Rich-text description with the Figma toolbar: heading, bold, underline, italic, list, link, AI suggestion. */
export default function DescriptionModal({ html, title, type, onClose, onSave }: Props) {
  const editor = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const [empty, setEmpty] = useState(!html)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [active, setActive] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (editor.current) {
      editor.current.innerHTML = html
      editor.current.focus()
    }
  }, [html])

  const refresh = () => {
    setEmpty(!editor.current?.textContent?.trim())
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      list: document.queryCommandState('insertUnorderedList'),
      heading: /^h3$/i.test(String(document.queryCommandValue('formatBlock'))),
    })
  }

  const exec = (cmd: string, arg?: string) => {
    editor.current?.focus()
    document.execCommand(cmd, false, arg)
    refresh()
  }

  function runTool(id: string) {
    if (id === 'heading') exec('formatBlock', active.heading ? 'P' : 'H3')
    else if (id === 'bold' || id === 'underline' || id === 'italic') exec(id)
    else if (id === 'list') exec('insertUnorderedList')
    else if (id === 'link') {
      const sel = window.getSelection()
      savedRange.current = sel && sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0).cloneRange() : null
      setLinkOpen((o) => !o)
    }
  }

  const applyLink = () => {
    const href = /^https?:\/\//.test(url) ? url : `https://${url}`
    editor.current?.focus()
    const sel = window.getSelection()
    if (savedRange.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
      document.execCommand('createLink', false, href)
    } else {
      document.execCommand('insertHTML', false, `<a href="${href}">${url}</a>&nbsp;`)
    }
    setLinkOpen(false)
    setUrl('')
    refresh()
  }

  return (
    <DialogShell icon={NoteEditIcon} title="Add description" onClose={onClose} footer={<><span /><SubmitButton onSubmit={() => { const html = editor.current?.innerHTML ?? ''; return () => onSave(html) }}>Save</SubmitButton></>}>
      <div className="relative flex flex-col rounded-2xl bg-white">
        {empty && <p className="pointer-events-none absolute top-5 left-5 text-base text-ink-600">Write your description</p>}
        <div
          ref={editor}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Event description"
          suppressContentEditableWarning
          onInput={refresh}
          onKeyUp={refresh}
          onMouseUp={refresh}
          onPaste={(e) => {
            e.preventDefault()
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
          }}
          className="rich-text min-h-[220px] px-5 pt-5 pb-3 text-base leading-[1.5] text-ink-900 outline-none"
        />
        {linkOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (url.trim()) applyLink()
            }}
            className="mx-5 mb-2 flex items-center gap-2 rounded-lg bg-ink-900 p-1.5 pl-3"
          >
            <input
              id="desc-link"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste the URL"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
            />
            <button type="submit" className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-ink-900">
              Add link
            </button>
          </form>
        )}
        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <div className="flex items-center gap-1">
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                aria-label={t.label}
                aria-pressed={Boolean(active[t.id]) || (t.id === 'link' && linkOpen)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runTool(t.id)}
                className={`flex size-8 items-center justify-center rounded-md text-ink-800 hover:bg-ink-100 ${active[t.id] || (t.id === 'link' && linkOpen) ? 'bg-ink-200' : ''}`}
              >
                <Icon icon={t.icon} size={18} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (editor.current) editor.current.innerHTML = suggestion(title, type)
              refresh()
            }}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-ink-800 hover:bg-ink-100"
          >
            <Icon icon={AiMagicIcon} size={18} className="text-brand-500" />
            AI suggestion
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
