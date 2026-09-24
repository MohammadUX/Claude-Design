import type { CSSProperties } from 'react'

/** Figma "Background gradient" for event detail pages. It is fixed to the viewport, so it stays put while the page scrolls. */
export const detailGradient = 'linear-gradient(180deg, rgba(93, 88, 243, 0.6) 0%, rgba(246, 247, 247, 0.6) 28.846%)'

/**
 * Frosted surface for bars that sit over the fixed gradient (top nav, breadcrumb): the same gradient pinned to the
 * viewport on the same solid base, plus a blur, so it blends in seamlessly and content scrolling underneath is hidden.
 */
export const frostedOverGradient: CSSProperties = {
  backgroundImage: `${detailGradient}, linear-gradient(#f6f7f7, #f6f7f7)`,
  backgroundAttachment: 'fixed',
  backgroundSize: '100% 1024px, 100% 100%',
  backgroundRepeat: 'no-repeat',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
}
