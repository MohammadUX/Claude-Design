import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto flex max-w-[1250px] flex-col gap-6">
      <Link to="/events" className="flex w-fit items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900">
        <Icon icon={ArrowLeft01Icon} size={18} />
        Back to Events
      </Link>
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-ink-200 bg-white text-center">
        <h1 className="text-2xl leading-[1.1] font-semibold text-ink-900">{title}</h1>
        <p className="max-w-sm text-sm text-ink-600">{note ?? 'This screen is not part of the prototype yet.'}</p>
      </div>
    </div>
  )
}
