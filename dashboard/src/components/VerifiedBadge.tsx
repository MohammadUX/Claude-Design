import { CheckmarkBadge02Icon } from '@hugeicons/core-free-icons'
import Icon from './Icon'

export default function VerifiedBadge({ size = 20 }: { size?: number }) {
  return (
    <span className="shrink-0 text-verified" title="Verified">
      <Icon icon={CheckmarkBadge02Icon} size={size} className="[&_path:first-child]:fill-current [&_path:last-child]:stroke-white" />
    </span>
  )
}
