import type { EventDetail } from './eventDetail'
import { allEvents, featuredEvents, type EventItem } from './mock'

/** Details for events published in this session, merged over the defaults in getEventDetail. */
export const customDetails = new Map<string, Partial<EventDetail>>()

export function publishEvent(event: EventItem, detail: Partial<EventDetail>) {
  featuredEvents.unshift(event)
  allEvents.unshift(event)
  customDetails.set(event.id, detail)
}
