import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { useEffect, type ReactNode } from 'react'
import Icon from './Icon'

type ModalProps = { title: string; onClose: () => void; children: ReactNode }

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_64px_rgba(35,40,40,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="text-lg leading-[1.1] font-semibold text-ink-900">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-100">
            <Icon icon={Cancel01Icon} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
