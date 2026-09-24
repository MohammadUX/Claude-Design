import { SparklesIcon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Icon from '../../../components/Icon'
import type { EventType } from '../model'
import { eventTypes } from '../options'
import { DialogShell, PrimaryButton } from '../ui'


export default function EventTypeModal({ initial, onClose, onPick }: { initial: EventType | null; onClose: () => void; onPick: (t: EventType) => void }) {
  const [picked, setPicked] = useState<EventType | null>(initial)
  return (
    <DialogShell
      icon={SparklesIcon}
      title="Event type"
      onClose={onClose}
      width="max-w-[920px]"
      footer={
        <>
          <span />
          <PrimaryButton disabled={!picked} onClick={() => picked && onPick(picked)}>
            Continue
          </PrimaryButton>
        </>
      }
    >
      <p className="text-base leading-[1.4] font-medium text-ink-900">What type of event are you hosting?</p>
      <div role="radiogroup" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {eventTypes.map((t) => {
          const on = picked === t.type
          return (
            <button
              key={t.type}
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(t.type)}
              onDoubleClick={() => onPick(t.type)}
              className={`flex flex-col gap-3 rounded-2xl border-2 bg-white p-1.5 pb-4 text-left transition-colors ${on ? 'border-brand-500' : 'border-transparent hover:border-ink-200'}`}
            >
              <span className="flex h-[104px] items-center justify-center rounded-xl text-ink-800" style={{ background: t.tint }}>
                <Icon icon={t.icon} size={44} strokeWidth={1.2} />
              </span>
              <span className="flex flex-col gap-1 px-2">
                <span className="text-base leading-[1.4] font-semibold text-ink-900">{t.type}</span>
                <span className="text-sm leading-[1.4] font-medium text-ink-700">{t.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
    </DialogShell>
  )
}
