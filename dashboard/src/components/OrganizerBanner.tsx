import { Link } from 'react-router-dom'
import bannerImage from '../assets/events/organizer-banner.jpg'
import Avatar from './Avatar'

export default function OrganizerBanner() {
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-[20.8px] border border-white bg-black">
      <img src={bannerImage} alt="ICEA stage screens: We run the SEO world" className="absolute inset-0 size-full object-cover object-[50%_45%]" />
      <Link
        to="/organizers/icea"
        className="absolute bottom-4 left-4 flex origin-bottom-left items-center gap-2 rounded-3xl bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out hover:scale-105 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 active:scale-[0.98]"
      >
        <Avatar name="Organizer" color="#232828" size={20} />
        <span className="text-base leading-[1.2] font-semibold whitespace-nowrap text-ink-900">Organizer name</span>
      </Link>
    </div>
  )
}
