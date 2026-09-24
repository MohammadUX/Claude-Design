import type { Category } from '../data/mock'
import Icon from './Icon'

type CategoryTileProps = {
  category: Category
  active?: boolean
  onClick?: () => void
}

export default function CategoryTile({ category, active, onClick }: CategoryTileProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 flex-1 items-center gap-4 rounded-2xl border bg-white p-4 text-left drop-shadow-[0_2px_4px_#eceeee] transition-colors ${
        active ? 'border-brand-500' : 'border-ink-200 hover:border-brand-300'
      }`}
    >
      <span style={{ color: category.color }}>
        <Icon icon={category.icon} size={40} strokeWidth={1.2} />
      </span>
      <span className="flex min-w-0 flex-col gap-1 leading-[1.4]">
        <span className="text-lg font-semibold whitespace-nowrap text-ink-900">{category.name}</span>
        <span className="text-sm font-medium text-ink-600">{category.eventCount}</span>
      </span>
    </button>
  )
}
