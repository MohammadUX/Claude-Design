import { spaceTabs, type SpaceTab } from './spaceTabs'

export default function SpaceTabs({ active, onChange }: { active: SpaceTab; onChange: (tab: SpaceTab) => void }) {
  return (
    <div role="tablist" aria-label="Event space" className="flex w-fit max-w-full overflow-x-auto rounded-[40px] border border-ink-200 bg-ink-200 p-1">
      {spaceTabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex h-[35px] shrink-0 items-center rounded-[40px] border px-4 text-base leading-[1.2] font-medium transition-colors ${
              selected
                ? 'border-ink-200 bg-white text-ink-800 drop-shadow-[0_2px_3.85px_rgba(0,0,0,0.04)]'
                : 'border-transparent text-ink-700 hover:text-ink-900'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
