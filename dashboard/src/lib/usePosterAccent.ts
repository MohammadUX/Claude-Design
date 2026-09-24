import { useEffect } from 'react'
import { extractAccent } from './dominantColor'

/** Tints the event page gradient (`--detail-accent`) with the poster's main colour. */
export function usePosterAccent(poster: string | null | undefined) {
  useEffect(() => {
    if (!poster) return
    let cancelled = false
    extractAccent(poster).then(([r, g, b]) => {
      if (!cancelled) document.documentElement.style.setProperty('--detail-accent', `rgb(${r} ${g} ${b})`)
    })
    return () => {
      cancelled = true
    }
  }, [poster])
}
