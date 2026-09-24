import { Delete02Icon, Edit04Icon, PlusSignIcon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/Icon'
import VerifiedBadge from '../../../components/VerifiedBadge'
import type { Draft, Speaker } from '../model'
import { panel, SectionTitle } from '../ui'

type Props = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  onAddSpeaker: () => void
  onEditSpeaker: (s: Speaker) => void
  onInvite: () => void
}

const roleTone = { Admin: 'bg-brand-100 text-brand-700', Moderator: 'bg-ink-100 text-ink-800', Guest: 'bg-ink-100 text-ink-800' }

export default function PeopleStep({ draft, set, onAddSpeaker, onEditSpeaker, onInvite }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle icon={UserGroupIcon}>Speakers and guests</SectionTitle>

      <div className={`${panel} divide-y divide-ink-200 overflow-hidden`}>
        <button onClick={onAddSpeaker} className="flex w-full items-center gap-2 px-4 py-3.5 text-left text-base text-ink-900 hover:bg-white">
          <Icon icon={PlusSignIcon} size={20} />
          Add speaker
        </button>
        {draft.speakers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={s.name} color={s.color} size={36} src={s.photo} />
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1 text-sm leading-[1.4] font-medium text-ink-900">
                  {s.name}
                  {s.verified && <VerifiedBadge size={16} />}
                  {s.source === 'backup' && <span className="ml-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">Backup profile</span>}
                </span>
                <span className="truncate text-xs leading-[1.4] text-ink-700">{s.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button aria-label={`Edit ${s.name}`} onClick={() => onEditSpeaker(s)} className="flex size-8 items-center justify-center rounded-lg text-ink-800 hover:bg-ink-100">
                <Icon icon={Edit04Icon} size={18} />
              </button>
              <button aria-label={`Remove ${s.name}`} onClick={() => set({ speakers: draft.speakers.filter((x) => x.id !== s.id) })} className="flex size-8 items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10">
                <Icon icon={Delete02Icon} size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${panel} divide-y divide-ink-200 overflow-hidden`}>
        <button onClick={onInvite} className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-base text-ink-900 hover:bg-white">
          <span className="flex items-center gap-2">
            <Icon icon={UserAdd01Icon} size={20} />
            Invite guest (team)
          </span>
          {draft.guests.length > 0 && <span className="text-sm font-medium text-brand-700">Manage</span>}
        </button>
        {draft.guests.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={g.name} color={g.color} size={36} />
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1 text-sm leading-[1.4] font-medium text-ink-900">
                  {g.name}
                  {g.verified && <VerifiedBadge size={16} />}
                </span>
                <span className="truncate text-xs leading-[1.4] text-ink-700">{g.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleTone[g.role]}`}>{g.role}</span>
              <button aria-label={`Remove ${g.name}`} onClick={() => set({ guests: draft.guests.filter((x) => x.id !== g.id) })} className="flex size-8 items-center justify-center rounded-lg text-danger-500 hover:bg-danger-500/10">
                <Icon icon={Delete02Icon} size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink-700">Speakers show on your event page. Team members get free access and the permissions you choose.</p>
    </div>
  )
}
