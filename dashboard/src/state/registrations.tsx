import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { RegistrationContext, type ChannelStatus, type RegistrationState } from './registrationContext'

/** Prototype-only session state: which events the viewer registered for, and what they joined. */
export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('ada.obi@example.com')
  const [registered, setRegistered] = useState<Set<string>>(() => new Set())
  const [subscribed, setSubscribed] = useState(false)
  const [channels, setChannels] = useState<Record<string, ChannelStatus>>({})

  const register = useCallback((id: string) => setRegistered((prev) => new Set(prev).add(id)), [])
  const unregister = useCallback(
    (id: string) =>
      setRegistered((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      }),
    [],
  )
  const setChannelStatus = useCallback((channel: string, status: ChannelStatus | undefined) => {
    setChannels((prev) => {
      const next = { ...prev }
      if (status) next[channel] = status
      else delete next[channel]
      return next
    })
  }, [])

  const value = useMemo<RegistrationState>(
    () => ({
      email,
      setEmail,
      isRegistered: (id) => registered.has(id),
      register,
      unregister,
      subscribed,
      setSubscribed,
      channelStatus: (channel) => channels[channel],
      setChannelStatus,
    }),
    [email, registered, register, unregister, subscribed, channels, setChannelStatus],
  )

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>
}
