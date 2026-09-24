import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import Icon from './Icon'

export type Pager = {
  canPrev: boolean
  canNext: boolean
  prev: () => void
  next: () => void
}

type SectionHeaderProps = {
  title: string
  /** Where the prev/next arrows sit: "end" (Featured Events) or "inline" beside the title (Live Events). */
  pagerPlacement?: 'end' | 'inline'
  pager?: Pager
  onSeeAll?: () => void
}

function PagerButtons({ pager }: { pager: Pager }) {
  const base = 'flex h-9 w-11 items-center justify-center rounded-[74px] px-3 py-2 transition-colors'
  const on = 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-200'
  const off = 'text-ink-600 cursor-default'
  return (
    <div className="flex items-center gap-1.5">
      <button aria-label="Previous" disabled={!pager.canPrev} onClick={pager.prev} className={`${base} ${pager.canPrev ? on : off}`}>
        <Icon icon={ArrowLeft01Icon} />
      </button>
      <button aria-label="Next" disabled={!pager.canNext} onClick={pager.next} className={`${base} ${pager.canNext ? on : off}`}>
        <Icon icon={ArrowRight01Icon} />
      </button>
    </div>
  )
}

export default function SectionHeader({ title, pagerPlacement = 'end', pager, onSeeAll }: SectionHeaderProps) {
  return (
    <div className="flex min-h-[22px] w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-lg leading-[1.1] font-semibold whitespace-nowrap text-ink-900">{title}</h2>
        {pager && pagerPlacement === 'inline' && <PagerButtons pager={pager} />}
      </div>
      {pager && pagerPlacement === 'end' && <PagerButtons pager={pager} />}
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-base leading-[1.4] font-medium whitespace-nowrap text-ink-800 hover:text-brand-500">
          See all
        </button>
      )}
    </div>
  )
}
