import { ArrowDown01Icon, FavouriteIcon, GiftIcon, Notification01Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router-dom'
import { frostedOverGradient } from '../layouts/detailBackground'
import Avatar from './Avatar'
import CreateMenu from './CreateMenu'
import Icon from './Icon'

export default function TopNav({ translucent = false }: { translucent?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-[72px] items-center justify-between border-b px-4 sm:px-6 ${
        translucent ? 'border-white/50' : 'border-ink-200 bg-ink-100'
      }`}
      style={translucent ? frostedOverGradient : undefined}
    >
      <Link to="/events" className="flex h-10 items-center" aria-label="PAAQ home">
        {/* Wordmark placeholder until the PAAQ logo asset can be exported from Figma */}
        <span className="flex items-baseline gap-0.5 text-[26px] leading-none font-bold tracking-tight text-ink-900">
          <span className="text-brand-500">?</span>PAAQ
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="hidden h-11 items-center gap-2 rounded-[40px] px-4 text-base leading-[1.2] font-medium text-ink-700 hover:bg-ink-200/60 md:flex">
          <Icon icon={GiftIcon} className="text-amber-500" />
          Refer a friend
        </button>
        <CreateMenu />
        <button aria-label="Saved events" className="flex size-11 items-center justify-center rounded-full bg-white text-ink-800 hover:bg-ink-200">
          <Icon icon={FavouriteIcon} />
        </button>
        <button aria-label="Notifications" className="relative flex size-11 items-center justify-center rounded-full bg-white text-ink-800 hover:bg-ink-200">
          <Icon icon={Notification01Icon} />
          <span className="absolute top-2 left-[22px] flex size-3 items-center justify-center rounded-full border border-white bg-danger-500 text-[10px] leading-none font-medium text-white">
            2
          </span>
        </button>
        <button className="flex items-center gap-1 rounded-full bg-white py-1.5 pr-2 pl-1.5 hover:bg-ink-200">
          <Avatar name="Ada Obi" color="#b45309" size={32} />
          <Icon icon={ArrowDown01Icon} size={16} className="text-ink-700" />
        </button>
      </div>
    </header>
  )
}
