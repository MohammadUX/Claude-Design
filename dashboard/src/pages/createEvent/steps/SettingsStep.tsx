import {
  CheckmarkCircle02Icon,
  CloudIcon,
  ChartColumnIcon,
  Image02Icon,
  LiveStreaming02Icon,
  Mail01Icon,
  MessageQuestionIcon,
  NoteEditIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import type { ReactNode } from 'react'
import Icon from '../../../components/Icon'
import type { Draft } from '../model'
import { InfoTip, panel, SectionTitle, Toggle } from '../ui'

function Row({ icon, label, tip, children, soon }: { icon: IconSvgElement; label: string; tip: string; children?: ReactNode; soon?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3.5 ${soon ? 'opacity-60' : ''}`}>
      <span className="flex items-center gap-2 text-sm leading-[1.4] font-medium text-ink-900">
        <Icon icon={icon} size={18} className="text-ink-700" />
        {label}
        <InfoTip text={tip} />
        {soon && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700">Coming soon</span>}
      </span>
      {children}
    </div>
  )
}

export default function SettingsStep({ draft, set }: { draft: Draft; set: (patch: Partial<Draft>) => void }) {
  const s = draft.settings
  const put = (patch: Partial<Draft['settings']>) => set({ settings: { ...s, ...patch } })
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SectionTitle icon={LiveStreaming02Icon}>During the event</SectionTitle>
        <div className={`${panel} divide-y divide-ink-200`}>
          <Row icon={UserGroupIcon} label="Attendee connect" tip="How long guests can see each other and request chats after the event.">
            <div role="radiogroup" aria-label="Attendee connect window" className="flex rounded-lg bg-ink-100 p-0.5">
              {(['7d', '30d', '90d'] as const).map((w) => (
                <button key={w} role="radio" aria-checked={s.connectWindow === w} onClick={() => put({ connectWindow: w })} className={`rounded-md px-3 py-1 text-sm font-medium ${s.connectWindow === w ? 'bg-brand-500 text-white' : 'text-ink-800'}`}>
                  {w}
                </button>
              ))}
            </div>
          </Row>
          <Row icon={MessageQuestionIcon} label="Question moderation" tip="You approve questions before everyone sees them in Q&A.">
            <Toggle label="Question moderation" checked={s.questionModeration} onChange={(v) => put({ questionModeration: v })} />
          </Row>
          <Row icon={Image02Icon} label="Allow attendee photos" tip="Guests who checked in can upload photos. You approve them before they show.">
            <Toggle label="Allow attendee photos" checked={s.attendeePhotos} onChange={(v) => put({ attendeePhotos: v })} />
          </Row>
          <Row icon={CloudIcon} label="Word cloud" tip="Ask a one-word question and watch answers form a live cloud." soon />
          <Row icon={ChartColumnIcon} label="Live polls" tip="Run quick polls during the session and show results live." soon />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <SectionTitle icon={CheckmarkCircle02Icon}>Emails</SectionTitle>
        <div className={`${panel} divide-y divide-ink-200`}>
          <Row icon={Mail01Icon} label="Reminder emails (before)" tip="We email guests 1 day and 1 hour before the event starts.">
            <Toggle label="Reminder emails" checked={s.reminderEmails} onChange={(v) => put({ reminderEmails: v })} />
          </Row>
          <Row icon={NoteEditIcon} label="Post-event recap (after)" tip="After the event, guests get the summary, resources and people to meet.">
            <Toggle label="Post-event recap" checked={s.recap} onChange={(v) => put({ recap: v })} />
          </Row>
        </div>
      </div>
    </div>
  )
}
