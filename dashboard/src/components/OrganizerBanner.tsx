import Avatar from './Avatar'

/** Hero banner. The real photo collage is a Figma image fill; this gradient stands in until it is exported. */
export default function OrganizerBanner() {
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-[20.8px] border border-white bg-black">
      <div className="absolute inset-0 grid grid-cols-[1fr_1.4fr_1fr_1fr]">
        <div className="bg-[linear-gradient(160deg,#111,#1e1b4b)]" />
        <div className="flex flex-col justify-start bg-[#4f46e5] p-4 md:p-8">
          <span className="text-2xl leading-none md:text-5xl font-semibold tracking-tight text-white/95">We run the</span>
          <span className="text-2xl leading-none md:text-5xl font-semibold tracking-tight text-white/95">SEO world.</span>
        </div>
        <div className="bg-[linear-gradient(180deg,#e5e7eb,#9ca3af)]" />
        <div className="flex flex-col justify-start bg-[#312e81] p-4 md:p-6">
          <span className="text-base leading-tight font-medium md:text-2xl text-white/90">The top talent in the industry.</span>
        </div>
      </div>
      <div className="absolute bottom-[26px] left-[9px] flex items-center gap-2 rounded-3xl bg-white px-3 py-2">
        <Avatar name="Organizer" color="#232828" size={20} />
        <span className="text-base leading-[1.2] font-semibold whitespace-nowrap text-ink-900">Organizer name</span>
      </div>
    </div>
  )
}
