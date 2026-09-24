import type { ReactNode } from 'react'
import type { Person } from '../../data/eventDetail'
import Avatar from '../Avatar'
import VerifiedBadge from '../VerifiedBadge'

/** Figma "member-row": avatar, name + verified badge, role, optional chip, and an action on the right. */
export default function PersonRow({ person, chip, action }: { person: Person; chip?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 px-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={person.name} color={person.color} size={32} src={person.photo} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm leading-[1.4] font-medium text-[#1a1d1f]">{person.name}</p>
            {person.verified && <VerifiedBadge size={16} />}
            {chip}
          </div>
          <p className="truncate text-xs leading-[1.4] font-medium text-ink-700">{person.role}</p>
        </div>
      </div>
      {action}
    </div>
  )
}
