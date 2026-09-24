import { InternetIcon, SquareLock02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import Avatar from '../../components/Avatar'
import Icon from '../../components/Icon'
import type { Channel } from '../../data/eventDetail'
import { attendeeColors } from '../../data/mock'
import { useRegistrations } from '../../state/registrationContext'

/** The event's community channel: public channels are joined instantly, private ones take a request. */
export default function ChannelCard({ channel, onToast }: { channel: Channel; onToast: (message: string) => void }) {
  const { channelStatus, setChannelStatus } = useRegistrations()
  const status = channelStatus(channel.name)
  const isPrivate = channel.visibility === 'Private'

  const act = () => {
    if (status) {
      setChannelStatus(channel.name, undefined)
      onToast(status === 'joined' ? `You left ${channel.name}` : 'Join request withdrawn')
    } else if (isPrivate) {
      setChannelStatus(channel.name, 'requested')
      onToast(`Request sent. The ${channel.name} admins will review it.`)
    } else {
      setChannelStatus(channel.name, 'joined')
      onToast(`Welcome to ${channel.name}`)
    }
  }

  const label = status === 'joined' ? 'Joined' : status === 'requested' ? 'Requested' : isPrivate ? 'Request to join' : 'Join channel'

  return (
    <div className="rounded-[15px] border border-ink-200 bg-white p-1 drop-shadow-[0_2px_4px_#eceeee]">
      <div className="flex gap-4 px-4 pt-4 pb-3">
        <Avatar name={channel.name} color={channel.color} size={44} className="border-2 border-white" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg leading-[1.1] font-semibold text-ink-800">{channel.name}</p>
              <span className="flex items-center gap-1 rounded-3xl border border-ink-200 bg-ink-100 px-2 py-1 text-xs leading-[1.2] font-medium tracking-[-0.24px] text-ink-800">
                <Icon icon={isPrivate ? SquareLock02Icon : InternetIcon} size={16} />
                {channel.visibility}
              </span>
            </div>
            <p className="text-sm leading-[1.4] font-medium text-ink-800">{channel.description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <span className="flex items-center">
                {attendeeColors.map((color, i) => (
                  <Avatar key={color} name="Member" color={color} size={24} plain className={`border-2 border-white ${i < 2 ? '-mr-2' : ''}`} />
                ))}
              </span>
              <span className="text-xs leading-[1.4] font-medium text-ink-700">
                {channel.members} Members{isPrivate ? ' · Invite only' : ''}
              </span>
            </div>
            <button
              onClick={act}
              aria-pressed={Boolean(status)}
              className={`flex items-center gap-1.5 rounded-[40px] border px-4 py-2 text-sm leading-[1.4] font-medium transition-colors ${
                status ? 'border-brand-500 bg-white text-brand-500 hover:bg-ink-100' : 'border-brand-500 bg-brand-500 text-white hover:brightness-95'
              }`}
            >
              {status && <Icon icon={Tick02Icon} size={18} />}
              {label}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
