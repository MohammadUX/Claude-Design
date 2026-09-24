import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

/** Small confirmation message at the bottom of the screen, e.g. "Added to your calendar". */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setMessage(text)
    timer.current = window.setTimeout(() => setMessage(null), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const toast = message ? (
    <div role="status" className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
      <Icon icon={CheckmarkCircle02Icon} size={18} className="text-brand-300" />
      {message}
    </div>
  ) : null

  return { show, toast }
}
