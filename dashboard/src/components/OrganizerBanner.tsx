import bannerImage from '../assets/events/organizer-banner.jpg'
import Avatar from './Avatar'

export default function OrganizerBanner() {
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-[20.8px] border border-white bg-black">
      <img src={bannerImage} alt="ICEA stage screens: We run the SEO world" className="absolute inset-0 size-full object-cover object-[50%_45%]" />
      <div className="absolute bottom-[26px] left-[9px] flex items-center gap-2 rounded-3xl bg-white px-3 py-2">
        <Avatar name="Organizer" color="#232828" size={20} />
        <span className="text-base leading-[1.2] font-semibold whitespace-nowrap text-ink-900">Organizer name</span>
      </div>
    </div>
  )
}
