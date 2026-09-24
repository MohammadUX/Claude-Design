type AvatarProps = {
  name: string
  color: string
  size: number
  className?: string
  /** Hide initials, e.g. in overlapping avatar stacks. */
  plain?: boolean
}

/** Placeholder for photo avatars until the Figma image assets can be exported. */
export default function Avatar({ name, color, size, className = '', plain = false }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: Math.max(8, size * 0.38) }}
      aria-hidden
    >
      {!plain && size >= 28 && initials}
    </span>
  )
}
