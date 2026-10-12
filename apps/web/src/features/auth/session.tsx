import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { SessionContext, type SessionState } from './useSession'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    // Fires INITIAL_SESSION with the persisted session (if any), then every sign-in/out/refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ status: 'ready', session })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <SessionContext value={state}>{children}</SessionContext>
}
