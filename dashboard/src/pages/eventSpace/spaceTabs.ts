export type SpaceTab = 'overview' | 'participants' | 'engagements' | 'resources'

export const spaceTabs: { id: SpaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'engagements', label: 'Engagements' },
  { id: 'resources', label: 'Resources' },
]
