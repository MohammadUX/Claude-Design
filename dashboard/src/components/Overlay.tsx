import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { OverlayContext } from './overlayContext'
import { createPortal } from 'react-dom'

const EXIT_MS = 170
let openCount = 0
/** When one pop-up replaces another (e.g. "Add speaker" → "Find expert"), skip the backdrop fade. */
let lastClosedAt = 0

type OverlayProps = {
  onClose: () => void
  /** Receives an animated close; use it for Cancel/Got it buttons so they ease out too. */
  children: (close: (after?: () => void) => void) => ReactNode
  label?: string
  labelledBy?: string
  /** Classes for the dialog panel (size, padding, background…). */
  panelClassName?: string
  panelStyle?: React.CSSProperties
  /** "center" for small dialogs, "top" for tall ones and the search palette. */
  align?: 'center' | 'top'
  backdrop?: 'blur' | 'soft'
  dismissible?: boolean
  role?: 'dialog' | 'alertdialog'
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * One behaviour for every pop-up: fade + blur backdrop, panel eases in and out, Esc and
 * click-outside close, page scroll locked, focus moved in and restored, kept in view when the
 * prototype is hosted in a scrolling frame.
 */
export default function Overlay({
  onClose,
  children,
  label,
  labelledBy,
  panelClassName = '',
  panelStyle,
  align = 'center',
  backdrop = 'blur',
  dismissible = true,
  role = 'dialog',
}: OverlayProps) {
  const [pending, setPending] = useState<{ after?: () => void } | null>(null)
  const closing = pending !== null
  const [instant] = useState(() => Date.now() - lastClosedAt < 250)
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  /** Eases the pop-up out, then runs `after` (e.g. save) or onClose. The first call wins. */
  const close = useCallback((after?: () => void) => setPending((p) => p ?? { after }), [])
  useEffect(() => {
    if (!pending) return
    const id = window.setTimeout(() => (pending.after ?? closeRef.current)(), reducedMotion() ? 0 : EXIT_MS)
    return () => window.clearTimeout(id)
  }, [pending])

  // Scroll lock (counted, so stacked pop-ups don't unlock early) and focus handling.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    openCount += 1
    document.documentElement.style.overflow = 'hidden'
    const el = panel.current
    if (el && !el.contains(document.activeElement)) {
      const auto = el.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
      ;(auto ?? el).focus({ preventScroll: true })
    }
    // In a host frame that scrolls (e.g. an artifact viewer), bring the dialog on screen.
    el?.scrollIntoView({ block: 'nearest' })
    return () => {
      openCount -= 1
      lastClosedAt = Date.now()
      if (openCount === 0) document.documentElement.style.overflow = ''
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation()
      close()
    }
    if (e.key === 'Tab' && panel.current) {
      const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea, select, [contenteditable="true"], [tabindex]:not([tabindex="-1"])')].filter(
        (n) => n.offsetParent !== null,
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const state = closing ? 'closing' : 'open'

  return createPortal(
    <div
      data-state={state}
      data-instant={instant || undefined}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => dismissible && e.target === e.currentTarget && close()}
      className={`overlay fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 ${align === 'center' ? 'items-center py-6' : 'items-start py-[8vh]'} ${
        backdrop === 'blur' ? 'overlay-blur bg-[rgba(35,40,40,0.12)]' : 'bg-ink-100/60'
      }`}
    >
      <div
        ref={panel}
        role={role}
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        data-state={state}
        className={`overlay-panel relative w-full outline-none ${panelClassName}`}
        style={panelStyle}
      >
        <OverlayContext.Provider value={close}>{children(close)}</OverlayContext.Provider>
      </div>
    </div>,
    document.body,
  )
}
