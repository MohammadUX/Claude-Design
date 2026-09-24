import { AiMagicIcon, Chatting01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { BookButton, RequestChatButton } from '../../components/event/PersonActions'
import PersonRow from '../../components/event/PersonRow'
import Icon from '../../components/Icon'
import type { EventDetail } from '../../data/eventDetail'
import { useRegistrations } from '../../state/registrationContext'

const perks = [
  { icon: UserGroupIcon, label: 'Every attendee & speaker' },
  { icon: Chatting01Icon, label: 'Connect, chat & book' },
  { icon: AiMagicIcon, label: 'AI matches for you' },
]

function Summary({ resources }: { resources: EventDetail['resources'] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg leading-[1.1] font-semibold text-ink-800">{resources.summaryTitle}</h2>
      <div className="flex flex-col gap-2 text-base leading-[1.4] font-medium text-ink-700">
        {resources.summary.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  )
}

export default function ResourcesTab({ detail, onToast }: { detail: EventDetail; onToast: (m: string) => void }) {
  const { subscribed, setSubscribed } = useRegistrations()
  const { resources } = detail
  const [done, setDone] = useState<Set<number>>(() => new Set())

  if (!subscribed) {
    return (
      <div className="flex flex-col gap-6">
        <Summary resources={resources} />
        {/* Upsell: "See who's in the room" */}
        <div
          className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-ink-200 p-5 sm:flex-row sm:items-center"
          style={{
            backgroundColor: '#f3f5f5',
            backgroundImage:
              'radial-gradient(40% 90% at 45% 50%, rgba(64,204,203,0.55), transparent 70%), radial-gradient(35% 80% at 75% 20%, rgba(134,239,172,0.45), transparent 70%), linear-gradient(90deg, #fff 0%, transparent 35%)',
          }}
        >
          <div className="flex flex-1 flex-col items-start gap-2">
            <h3 className="text-lg leading-[1.2] font-semibold text-ink-900">See who's in the room</h3>
            <p className="max-w-[260px] text-sm leading-[1.4] font-medium text-ink-700">
              Unlock the full notes, a take-home checklist, and people worth meeting from this session.
            </p>
            <button
              onClick={() => {
                setSubscribed(true)
                onToast('Upgraded. Your full resources are ready.')
              }}
              className="mt-3 rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:brightness-95"
            >
              Upgrade
            </button>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-[258px]">
            <p className="text-xs font-medium text-ink-800">What you get:</p>
            {perks.map((perk) => (
              <span key={perk.label} className="flex items-center gap-2 rounded-lg border border-white bg-white/80 px-3 py-2 text-xs font-medium text-ink-900">
                <Icon icon={perk.icon} size={16} className="text-ink-700" />
                {perk.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Summary resources={resources} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg leading-[1.1] font-semibold text-ink-800">How it helps you as a product designer</h2>
        <p className="text-base leading-[1.4] font-medium text-ink-700">{resources.howItHelps}</p>
        <p className="pt-2 text-base leading-[1.2] font-semibold text-ink-800">
          What to do next <span className="font-medium text-ink-600">({done.size}/{resources.checklist.length})</span>
        </p>
        <ul className="flex flex-col gap-3 pt-2">
          {resources.checklist.map((item, i) => (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-2 text-base leading-[1.4] font-medium text-ink-700">
                <input
                  id={`checklist-${i}`}
                  type="checkbox"
                  checked={done.has(i)}
                  onChange={() =>
                    setDone((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                  }
                  className="size-5 accent-brand-500"
                />
                <span className={done.has(i) ? 'text-ink-600 line-through' : ''}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg leading-[1.1] font-semibold text-ink-800">Booking suggestion</h2>
        <div className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
          {resources.bookingSuggestions.map((p) => (
            <PersonRow key={p.id} person={p} action={<BookButton onBook={() => onToast(`Booking request sent to ${p.name}`)} />} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-1.5 text-lg leading-[1.1] font-semibold text-ink-800">
          <Icon icon={AiMagicIcon} size={18} className="text-brand-500" />
          AI match to connect
        </h2>
        <div className="divide-y divide-ink-200 overflow-hidden rounded-xl border border-ink-200 bg-white">
          {resources.aiMatches.map((p) => (
            <PersonRow key={p.id} person={p} action={<RequestChatButton onRequest={() => onToast(`Chat request sent to ${p.name}`)} />} />
          ))}
        </div>
      </section>
    </div>
  )
}
