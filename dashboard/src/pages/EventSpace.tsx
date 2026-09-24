import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppDownloadFooter from '../components/event/AppDownloadFooter'
import EventBreadcrumb from '../components/event/EventBreadcrumb'
import { useToast } from '../components/Toast'
import { getEventDetail } from '../data/eventDetail'
import { defaultPoster } from '../data/mock'
import { usePosterAccent } from '../lib/usePosterAccent'
import { useRegistrations } from '../state/registrationContext'
import ChannelCard from './eventSpace/ChannelCard'
import EngagementsTab from './eventSpace/EngagementsTab'
import EventSummaryCard from './eventSpace/EventSummaryCard'
import OverviewTab from './eventSpace/OverviewTab'
import ParticipantsTab from './eventSpace/ParticipantsTab'
import ResourcesTab from './eventSpace/ResourcesTab'
import SpaceTabs from './eventSpace/SpaceTabs'
import { spaceTabs, type SpaceTab } from './eventSpace/spaceTabs'
import ComingSoon from './ComingSoon'

/** Figma "After registration": the registered guest's view of an event. */
export default function EventSpace() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const { isRegistered, email } = useRegistrations()
  const { show, toast } = useToast()
  const detail = getEventDetail(eventId)
  const poster = detail ? (detail.event.image ?? defaultPoster) : null
  usePosterAccent(poster)

  const justRegistered = (location.state as { justRegistered?: boolean } | null)?.justRegistered
  useEffect(() => {
    if (justRegistered) show(`You're registered. Your ticket is on its way to ${email}.`)
  }, [justRegistered, email, show])

  if (!detail || !poster) return <ComingSoon title="Event not found" note="This event isn't in the prototype data." />
  // Only registered guests get the event space; everyone else goes back to the public page.
  if (!isRegistered(detail.event.id)) return <Navigate to={`/events/${detail.event.id}`} replace />

  const requested = params.get('tab') as SpaceTab | null
  const tab: SpaceTab = spaceTabs.some((t) => t.id === requested) ? requested! : 'overview'
  const setTab = (t: SpaceTab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })
  const goingCount = detail.attending.count + 1

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-4 pb-4">
      <EventBreadcrumb title={detail.event.title} backTo={`/events/${detail.event.id}`} />

      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <EventSummaryCard detail={detail} poster={poster} onToast={show} onJoin={() => navigate(`/events/${detail.event.id}/live`)} />
          <ChannelCard channel={detail.channel} onToast={show} />
        </div>

        <SpaceTabs active={tab} onChange={setTab} />

        <div role="tabpanel">
          {tab === 'overview' && <OverviewTab detail={detail} goingCount={goingCount} onSeeAttendees={() => setTab('participants')} onToast={show} />}
          {tab === 'participants' && <ParticipantsTab detail={detail} goingCount={goingCount} onToast={show} />}
          {tab === 'engagements' && <EngagementsTab engagements={detail.engagements} />}
          {tab === 'resources' && <ResourcesTab detail={detail} onToast={show} />}
        </div>

        <AppDownloadFooter />
      </div>

      {toast}
    </div>
  )
}
