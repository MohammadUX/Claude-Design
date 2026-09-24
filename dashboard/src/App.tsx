import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import ComingSoon from './pages/ComingSoon'
import CreateEventPage from './pages/createEvent/CreateEventPage'
import EventDetail from './pages/EventDetail'
import EventSpace from './pages/EventSpace'
import EventsExplore from './pages/EventsExplore'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventsExplore />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/events/:eventId/space" element={<EventSpace />} />
        <Route path="/events/:eventId/live" element={<ComingSoon title="Live event room" note="The live room (stream, chat, Q&A, polls) is the next flow to build." />} />
        <Route path="/organizers/:organizerId" element={<ComingSoon title="Organizer profile" note="Waiting on the organizer profile designs." />} />
        <Route path="/bookings/create" element={<ComingSoon title="Create a booking" note="The booking flow isn't part of this prototype yet." />} />
        <Route path="/channels/create" element={<ComingSoon title="Create a channel" note="The channel flow isn't part of this prototype yet." />} />
        <Route path="/masterclasses/create" element={<ComingSoon title="Create a masterclass" note="The masterclass flow isn't part of this prototype yet." />} />
        <Route path="/events/:eventId/manage" element={<ComingSoon title="Event dashboard" note="Host-side event management is the next flow to build." />} />
        <Route path="*" element={<ComingSoon title="Not in this prototype yet" />} />
      </Route>
    </Routes>
  )
}
