import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import { ViewportLab } from './ViewportLab'

// Export (JSON/CSV) lands here in Phase 4.
export function SettingsPage() {
  const state = useSession()
  const email = state.status === 'ready' ? state.session?.user.email : undefined

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Sesión iniciada como</span>
          <span className="font-medium">{email}</span>
        </div>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          <LogOut /> Cerrar sesión
        </Button>
      </div>
      <ViewportLab />
    </section>
  )
}
