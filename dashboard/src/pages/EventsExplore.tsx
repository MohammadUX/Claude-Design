import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { useMemo, useState } from 'react'
import CategoryTile from '../components/CategoryTile'
import EventCard from '../components/EventCard'
import EventCarousel from '../components/EventCarousel'
import Icon from '../components/Icon'
import OrganizerBanner from '../components/OrganizerBanner'
import OrganizerCard from '../components/OrganizerCard'
import SearchFilterBar, { type PriceFilter } from '../components/SearchFilterBar'
import SectionHeader from '../components/SectionHeader'
import { allEvents, categories, featuredEvents, liveEvents, organizers } from '../data/mock'

export default function EventsExplore() {
  const [query, setQuery] = useState('')
  const [price, setPrice] = useState<PriceFilter>('all')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [liveOnly, setLiveOnly] = useState(false)

  const isFiltering = query.trim() !== '' || price !== 'all' || categoryId !== null || liveOnly

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allEvents.filter((e) => {
      if (liveOnly && !e.isLive) return false
      if (q && !`${e.title} ${e.date}`.toLowerCase().includes(q)) return false
      if (price === 'free' && e.priceFrom !== null) return false
      if (price === 'paid' && e.priceFrom === null) return false
      if (categoryId && e.categoryId !== categoryId) return false
      return true
    })
  }, [query, price, categoryId, liveOnly])

  const clearAll = () => {
    setQuery('')
    setPrice('all')
    setCategoryId(null)
    setLiveOnly(false)
  }

  const activeCategory = categories.find((c) => c.id === categoryId)
  const resultsTitle = liveOnly ? 'Live Events' : activeCategory ? `${activeCategory.name} events` : 'Search results'

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-6">
      <OrganizerBanner />

      <div className="flex flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl leading-[1.1] font-semibold whitespace-nowrap text-ink-900">Events</h1>
          <SearchFilterBar
            query={query}
            onQueryChange={setQuery}
            price={price}
            onPriceChange={setPrice}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
          />
        </div>

        {isFiltering ? (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg leading-[1.1] font-semibold text-ink-900">
                {resultsTitle} <span className="font-medium text-ink-600">({results.length})</span>
              </h2>
              <button onClick={clearAll} className="flex items-center gap-1 text-base font-medium text-ink-800 hover:text-brand-500">
                <Icon icon={Cancel01Icon} size={18} />
                Clear filters
              </button>
            </div>
            {results.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                {results.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="flex h-60 flex-col items-center justify-center gap-1 rounded-[20px] border border-dashed border-ink-200 bg-white">
                <p className="text-base font-semibold text-ink-900">No events match your search</p>
                <p className="text-sm text-ink-600">Try a different keyword or clear the filters.</p>
              </div>
            )}
          </section>
        ) : (
          <div className="flex flex-col gap-12">
            <EventCarousel title="Featured Events" events={featuredEvents} />

            <section className="flex flex-col gap-5">
              <SectionHeader title="Events by categories" onSeeAll={() => setCategoryId(categories[0].id)} />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {categories.map((c) => (
                  <CategoryTile key={c.id} category={c} onClick={() => setCategoryId(c.id)} />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <SectionHeader title="Top Organizers" onSeeAll={() => {}} />
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
                {organizers.map((o) => (
                  <OrganizerCard key={o.id} organizer={o} />
                ))}
              </div>
            </section>

            <EventCarousel title="Live Events" events={liveEvents} pagerPlacement="inline" onSeeAll={() => setLiveOnly(true)} />
          </div>
        )}
      </div>
    </div>
  )
}
