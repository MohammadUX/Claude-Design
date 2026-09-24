import {
  Analytics01Icon,
  CalendarFavorite02Icon,
  DiscoverCircleIcon,
  Home01Icon,
  Mortarboard01Icon,
  Ticket03Icon,
  UserGroupIcon,
  Wallet03Icon,
} from '@hugeicons/core-free-icons'
import { NavLink } from 'react-router-dom'
import Avatar from './Avatar'
import Icon from './Icon'

const items = [
  { label: 'Home', to: '/home', icon: Home01Icon },
  { label: 'Explore', to: '/explore', icon: DiscoverCircleIcon },
  { label: 'Bookings', to: '/bookings', icon: Ticket03Icon },
  { label: 'Events', to: '/events', icon: CalendarFavorite02Icon },
  { label: 'Community', to: '/community', icon: UserGroupIcon },
  { label: 'Masterclass', to: '/masterclass', icon: Mortarboard01Icon },
  { label: 'Wallet', to: '/wallet', icon: Wallet03Icon },
  { label: 'Insight', to: '/insight', icon: Analytics01Icon },
]

export default function SideNav() {
  return (
    <nav className="sticky top-[72px] hidden h-[calc(100vh-72px)] max-h-[960px] w-[72px] shrink-0 flex-col items-start justify-between bg-ink-100 px-4 pt-[120px] pb-10 md:flex">
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex size-10 items-center justify-center rounded-xl p-1.5 transition-colors ${
                  isActive ? 'bg-white text-ink-900 shadow-card' : 'text-ink-700 hover:bg-ink-200'
                }`
              }
            >
              <Icon icon={item.icon} size={24} />
            </NavLink>
          </li>
        ))}
      </ul>
      <Avatar name="Ada Obi" color="#b45309" size={40} />
    </nav>
  )
}
