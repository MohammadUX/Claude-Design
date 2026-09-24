import { Add01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import type { Organizer } from '../data/mock'
import Avatar from './Avatar'
import Icon from './Icon'
import VerifiedBadge from './VerifiedBadge'

export default function OrganizerCard({ organizer }: { organizer: Organizer }) {
  const [following, setFollowing] = useState(false)
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden rounded-[20px] border border-ink-200 bg-white p-3.5 shadow-card">
      <div className="flex flex-col gap-3">
        <Avatar name={organizer.name} color={organizer.color} size={47} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base leading-[1.2] font-semibold text-ink-900">{organizer.name}</p>
            <VerifiedBadge size={24} />
          </div>
          <p className="text-sm leading-[1.4] text-ink-700">{organizer.tagline}</p>
        </div>
      </div>
      <button
        onClick={() => setFollowing((f) => !f)}
        aria-pressed={following}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500 px-3 py-2 text-base leading-[1.4] font-medium transition-colors ${
          following ? 'bg-brand-500 text-white' : 'text-brand-500 hover:bg-brand-500/5'
        }`}
      >
        <Icon icon={following ? Tick02Icon : Add01Icon} />
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
