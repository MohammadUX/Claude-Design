import { Add01Icon, Chatting01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import Icon from '../Icon'

type Size = 'sm' | 'tall' | 'md'

const pad = (size: Size) => (size === 'sm' ? 'px-3 py-1 text-sm' : size === 'tall' ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base')

export function FollowButton({ size = 'sm', onChange }: { size?: Size; onChange?: (following: boolean) => void }) {
  const [following, setFollowing] = useState(false)
  return (
    <button
      onClick={() => {
        setFollowing(!following)
        onChange?.(!following)
      }}
      aria-pressed={following}
      className={`flex shrink-0 items-center gap-2 rounded-3xl border leading-[1.4] font-medium transition-colors ${pad(size)} ${
        following ? 'border-brand-500 bg-white text-brand-500' : 'border-brand-300 bg-brand-500 text-white hover:brightness-95'
      }`}
    >
      <Icon icon={following ? Tick02Icon : Add01Icon} />
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

export function InviteButton({ onInvite }: { onInvite?: () => void }) {
  const [invited, setInvited] = useState(false)
  return (
    <button
      onClick={() => {
        setInvited(true)
        onInvite?.()
      }}
      disabled={invited}
      className="flex shrink-0 items-center gap-2 rounded-3xl border border-brand-100 bg-brand-100 px-3 py-1 text-xs leading-[1.4] font-medium text-brand-700"
    >
      <Icon icon={invited ? Tick02Icon : Add01Icon} />
      {invited ? 'Invite sent' : 'Invite to PAAQ'}
    </button>
  )
}

export function RequestChatButton({ onRequest }: { onRequest?: () => void }) {
  const [requested, setRequested] = useState(false)
  return (
    <button
      onClick={() => {
        setRequested(true)
        onRequest?.()
      }}
      disabled={requested}
      className={`flex shrink-0 items-center gap-2 rounded-3xl border px-3 py-1 text-sm leading-[1.4] font-medium transition-colors ${
        requested ? 'border-brand-500 bg-white text-brand-500' : 'border-brand-300 bg-brand-500 text-white hover:brightness-95'
      }`}
    >
      <Icon icon={requested ? Tick02Icon : Chatting01Icon} />
      {requested ? 'Chat requested' : 'Request a chat'}
    </button>
  )
}

export function BookButton({ onBook }: { onBook?: () => void }) {
  return (
    <button
      onClick={onBook}
      className="flex shrink-0 items-center gap-2 rounded-3xl border border-brand-300 bg-brand-500 px-3 py-1 text-sm leading-[1.4] font-medium text-white hover:brightness-95"
    >
      <Icon icon={Add01Icon} />
      Book now
    </button>
  )
}
