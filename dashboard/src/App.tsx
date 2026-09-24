import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import ComingSoon from './pages/ComingSoon'
import EventDetail from './pages/EventDetail'
import EventsExplore from './pages/EventsExplore'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventsExplore />} />
        <Route
          path="/events/create"
          element={<ComingSoon title="Create event" note="Waiting on the Create Event designs from Figma." />}
        />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/organizers/:organizerId" element={<ComingSoon title="Organizer profile" note="Waiting on the organizer profile designs." />} />
        <Route path="*" element={<ComingSoon title="Not in this prototype yet" />} />
      </Route>
    </Routes>
  )
}
