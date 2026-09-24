import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'

type IconProps = {
  icon: IconSvgElement
  size?: number
  className?: string
  strokeWidth?: number
}

/** The Figma file uses Hugeicons (stroke, 1.5) throughout. */
export default function Icon({ icon, size = 20, className, strokeWidth = 1.5 }: IconProps) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth} color="currentColor" className={className} />
}
