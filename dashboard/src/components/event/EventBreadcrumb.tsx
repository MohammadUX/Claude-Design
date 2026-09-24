import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Link, useNavigate } from 'react-router-dom'
import { frostedOverGradient } from '../../layouts/detailBackground'
import Icon from '../Icon'

/** Sticks under the top bar and hides whatever scrolls beneath it. */
export default function EventBreadcrumb({ title, backTo = '/events' }: { title: string; backTo?: string }) {
  const navigate = useNavigate()
  return (
    <div className="sticky top-[72px] z-20 -mx-4 -mt-5 flex items-center gap-2 px-4 py-3" style={frostedOverGradient}>
      <button aria-label="Back" onClick={() => navigate(backTo)} className="flex size-10 items-center justify-center rounded-full text-ink-900 hover:bg-white/60">
        <Icon icon={ArrowLeft02Icon} size={24} />
      </button>
      <nav className="flex min-w-0 items-center gap-1 text-base leading-[1.4] font-medium text-ink-900">
        <Link to="/events" className="hover:text-brand-500">
          Events
        </Link>
        <span>/</span>
        <span className="truncate">{title}</span>
      </nav>
    </div>
  )
}
