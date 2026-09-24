import { useCallback, useEffect, useRef, useState } from 'react'
import type { EventItem } from '../data/mock'
import EventCard from './EventCard'
import SectionHeader, { type Pager } from './SectionHeader'

type EventCarouselProps = {
  title: string
  events: EventItem[]
  pagerPlacement?: 'end' | 'inline'
  onSeeAll?: () => void
}

/** Four cards per view on the 1250px content column, 20px gap; arrows page by one view. */
export default function EventCarousel({ title, events, pagerPlacement, onSeeAll }: EventCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ canPrev: false, canNext: true })

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setEdges({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  const scrollByView = (dir: 1 | -1) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth + 20), behavior: 'smooth' })
  }

  const pager: Pager = { ...edges, prev: () => scrollByView(-1), next: () => scrollByView(1) }

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader title={title} pager={pager} pagerPlacement={pagerPlacement} onSeeAll={onSeeAll} />
      <div ref={trackRef} onScroll={updateEdges} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto">
        {events.map((event) => (
          <div key={event.id} className="w-[calc((100%-60px)/4)] min-w-[240px] shrink-0 snap-start">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  )
}
