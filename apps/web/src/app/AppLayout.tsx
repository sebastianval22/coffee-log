import { Coffee, House, LogOut, Plus, Store, type LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/bags', label: 'Cafés', icon: Coffee },
  { to: '/visits', label: 'Cafeterías', icon: Store },
]

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src="/logo.svg" alt="" className="size-8 rounded-lg" />
            Coffee Log
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
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
          <div className="ml-auto flex items-center gap-2">
            <Button asChild className="hidden md:inline-flex">
              <Link to="/new">
                <Plus /> Registrar
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const items: NavItem[] = [NAV[0], NAV[1], { to: '/new', label: 'Registrar', icon: Plus }, NAV[2]]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid h-16 grid-cols-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              {item.to === '/new' ? (
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
