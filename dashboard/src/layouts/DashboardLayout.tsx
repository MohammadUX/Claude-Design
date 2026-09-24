import { useEffect } from 'react'
import { Outlet, useLocation, useMatch } from 'react-router-dom'
import SideNav from '../components/SideNav'
import TopNav from '../components/TopNav'
import { detailGradient } from './detailBackground'

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const detailMatch = useMatch('/events/:eventId/*')
  const isDetail = detailMatch !== null

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="isolate min-h-screen bg-ink-100">
      {isDetail && <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[1024px]" style={{ backgroundImage: detailGradient }} />}
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
