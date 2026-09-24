import { useEffect } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import SideNav from '../components/SideNav'
import TopNav from '../components/TopNav'

/** Event detail pages sit on the purple "Background gradient" from Figma; other pages use the plain grey ground. */
const detailGradient = 'linear-gradient(180deg, rgba(93, 88, 243, 0.6) 0%, rgba(246, 247, 247, 0.6) 28.846%), #f6f7f7'

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const detailMatch = useMatch('/events/:eventId')
  const isDetail = detailMatch !== null && detailMatch.params.eventId !== 'create'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-ink-100" style={isDetail ? { background: `${detailGradient}`, backgroundSize: '100% 1024px', backgroundRepeat: 'no-repeat', backgroundColor: '#f6f7f7' } : undefined}>
      <TopNav translucent={isDetail} />
      <div className="flex">
        <SideNav />
        <main className="min-w-0 flex-1 px-4 pt-5 pb-20 sm:px-6 xl:px-[59px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
