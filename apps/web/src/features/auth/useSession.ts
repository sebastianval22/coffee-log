import type { Session } from '@supabase/supabase-js'
import { createContext, use } from 'react'

export type SessionState = { status: 'loading' } | { status: 'ready'; session: Session | null }

export const SessionContext = createContext<SessionState>({ status: 'loading' })

export function useSession() {
  return use(SessionContext)
}
