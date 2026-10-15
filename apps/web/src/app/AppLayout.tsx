import { Bean, House, Plus, Settings, Store, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon }

const HOME: NavItem = { to: '/', label: 'Inicio', icon: House }
const BAGS: NavItem = { to: '/bags', label: 'Cafés', icon: Bean }
const VISITS: NavItem = { to: '/visits', label: 'Cafeterías', icon: Store }
const SETTINGS: NavItem = { to: '/settings', label: 'Ajustes', icon: Settings }
const NEW: NavItem = { to: '/new', label: 'Registrar', icon: Plus }

/**
 * App shell pinned to the screen: only <main> scrolls. Its height comes from `--app-height`
 * (set in index.html for the installed iOS app, where the launch viewport is too short until
 * the first scroll) and falls back to the dynamic viewport height elsewhere.
 */
export function AppLayout() {
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // The scroll container is <main>, not the window, so reset it on navigation ourselves.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="fixed inset-x-0 top-0 flex h-(--app-height,100dvh) flex-col">
      <header className="shrink-0 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src="/logo.svg" alt="" className="size-8 rounded-lg" />
            Coffee Log
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[HOME, BAGS, VISITS].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground',
                    isActive && 'bg-secondary text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button asChild>
              <Link to="/new">
                <Plus /> Registrar
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Ajustes">
              <Link to="/settings">
                <Settings />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main ref={main} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-6xl px-4 py-6 md:pb-10">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

/** Phone tab bar: Registrar sits in the middle of five slots. */
function BottomNav() {
  return (
    <nav className="shrink-0 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid h-16 grid-cols-5">
        {[HOME, BAGS, NEW, VISITS, SETTINGS].map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              {item === NEW ? (
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <item.icon className="size-5" />
                </span>
              ) : (
                <item.icon className="size-5" />
              )}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
