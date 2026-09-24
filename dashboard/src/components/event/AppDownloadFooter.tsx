import { AppleIcon, PlayStoreIcon } from '@hugeicons/core-free-icons'
import Icon from '../Icon'

export default function AppDownloadFooter() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink-200 pt-3">
      <span className="text-base leading-[1.4] font-medium text-ink-900">Download PAAQ App:</span>
      <span className="flex h-10 w-[120px] items-center gap-2 rounded-lg bg-black px-3 text-white">
        <Icon icon={AppleIcon} size={20} />
        <span className="flex flex-col leading-none whitespace-nowrap">
          <span className="text-[7px]">Download on the</span>
          <span className="text-[11px] font-semibold">Apple Store</span>
        </span>
      </span>
      <span className="flex h-10 w-[120px] items-center gap-2 rounded-lg bg-black px-3 text-white">
        <Icon icon={PlayStoreIcon} size={20} className="text-[#34a853]" />
        <span className="flex flex-col leading-none whitespace-nowrap">
          <span className="text-[7px]">GET IT ON</span>
          <span className="text-[11px] font-semibold">Google Play</span>
        </span>
      </span>
    </div>
  )
}
