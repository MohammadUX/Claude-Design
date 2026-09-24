import { createContext, useContext } from 'react'

export type ChannelStatus = 'joined' | 'requested'

export type RegistrationState = {
  email: string
  setEmail: (email: string) => void
  isRegistered: (eventId: string) => boolean
  register: (eventId: string) => void
  unregister: (eventId: string) => void
  /** Paid tier that unlocks the full Resources tab. */
  subscribed: boolean
  setSubscribed: (value: boolean) => void
  channelStatus: (channel: string) => ChannelStatus | undefined
  setChannelStatus: (channel: string, status: ChannelStatus | undefined) => void
}

export const RegistrationContext = createContext<RegistrationState | null>(null)

export function useRegistrations() {
  const ctx = useContext(RegistrationContext)
  if (!ctx) throw new Error('useRegistrations must be used inside RegistrationProvider')
  return ctx
}
