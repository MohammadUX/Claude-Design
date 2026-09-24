import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import type { CSSProperties } from 'react'
import type { Sponsor } from '../../data/eventDetail'
import Avatar from '../Avatar'
import Icon from '../Icon'

const tierStyle: Record<Sponsor['tier'], { label: string; className: string; style?: CSSProperties }> = {
  gold: {
    label: 'Gold Sponsor',
    className: 'border-[#e2ac0c] text-white',
    style: { backgroundImage: 'linear-gradient(90deg, #f5db6d 0%, #c5921d 24%, #ffc94e 52%, #c5921d 81%, #f5db6d 99%)' },
  },
  silver: {
    label: 'Silver Sponsor',
    className: 'border-[#a2a0a0] text-ink-900',
    style: { backgroundImage: 'linear-gradient(91deg, #9b9b9b 0%, #d0d0d0 13%, #fff 48%, #d0d0d0 88%, #9b9b9b 100%)' },
  },
  help: { label: 'Help Sponsor', className: 'border-ink-200 bg-white text-ink-800' },
}

export default function SponsorRow({ sponsor }: { sponsor: Sponsor }) {
  const tier = tierStyle[sponsor.tier]
  return (
    <div className="flex w-full items-center gap-3 rounded-[20px] p-1">
      <Avatar name={sponsor.name} color={sponsor.color} size={40} src={sponsor.logo} />
      <p className="text-base leading-[1.2] font-semibold whitespace-nowrap text-ink-900">{sponsor.name}</p>
      <span className={`rounded-[40px] border-[0.5px] px-3 py-1 text-xs leading-[1.4] font-medium whitespace-nowrap ${tier.className}`} style={tier.style}>
        {tier.label}
      </span>
      {sponsor.website && (
        <span title={sponsor.website} className="text-ink-700">
          <Icon icon={LinkSquare02Icon} />
        </span>
      )}
    </div>
  )
}
