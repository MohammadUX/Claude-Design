import { Outlet } from 'react-router-dom'
import SideNav from '../components/SideNav'
import TopNav from '../components/TopNav'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-ink-100">
      <TopNav />
      <div className="flex">
        <SideNav />
        <main className="min-w-0 flex-1 px-4 pt-5 pb-20 sm:px-6 xl:px-[59px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
