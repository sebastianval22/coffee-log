import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from './useSession'

export function RequireAuth() {
  const state = useSession()
  const location = useLocation()

  if (state.status === 'loading') return <Splash />
  if (!state.session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <img src="/logo.svg" alt="" className="size-16 animate-pulse rounded-2xl" />
    </div>
  )
}
