type AvatarProps = {
  name: string
  color: string
  size: number
  className?: string
  /** Hide initials, e.g. in overlapping avatar stacks. */
  plain?: boolean
  /** Photo or logo; falls back to initials on a colour. */
  src?: string
}

/** Placeholder for photo avatars until the Figma image assets can be exported. */
export default function Avatar({ name, color, size, className = '', plain = false, src }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        className={`inline-block shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size, background: color }}
      />
    )
  }
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
