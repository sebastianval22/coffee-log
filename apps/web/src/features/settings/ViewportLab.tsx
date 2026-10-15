import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NativeSelect } from '@/components/form'
import { Button } from '@/components/ui/button'

type Sample = Record<string, string | number | null> & { label: string }

declare global {
  interface Window {
    __viewportLog?: Sample[]
    __viewportFix?: string
    __measureViewport?: (label: string) => void
  }
}

/** Fix strategies for the installed-app launch bug; read by the inline script in index.html. */
const MODES = {
  vh: 'A · Alto 100vh',
  nudge: 'B · 100vh + empujón de scroll',
  none: 'C · Sin arreglo',
}

/** Temporary diagnostics for the tab bar floating on iOS launch (see index.html). */
export function ViewportLab() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('viewportFix') || 'vh'
    } catch {
      return 'vh'
    }
  })
  const [, refresh] = useState(0)
  const active = window.__viewportFix ?? '?'

  function measureNow() {
    window.__measureViewport?.('ahora')
    refresh((n) => n + 1)
  }

  const samples = window.__viewportLog ?? []
  const text = [
    `modo activo: ${active}`,
    ...samples.map((s) => Object.entries(s).map(([k, v]) => `${k}=${v}`).join(' ')),
  ].join('\n')

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-col">
        <span className="font-medium">Pantalla (diagnóstico)</span>
        <span className="text-sm text-muted-foreground">
          Arreglo activo: {active === 'browser' ? 'ninguno (estás en el navegador)' : (MODES[active as keyof typeof MODES] ?? active)}
        </span>
      </div>
      <NativeSelect
        aria-label="Arreglo de pantalla"
        options={MODES}
        allowEmpty={false}
        value={mode}
        onChange={(e) => {
          setMode(e.target.value)
          try {
            localStorage.setItem('viewportFix', e.target.value)
          } catch {
            // Private mode: nothing to remember.
          }
          toast('Cierra la app por completo y vuelve a abrirla para probarlo')
        }}
      />
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">{text}</pre>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={measureNow}>
          Medir ahora
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() =>
            navigator.clipboard.writeText(text).then(
              () => toast.success('Copiado'),
              () => toast.error('No se pudo copiar'),
            )
          }
        >
          <Copy /> Copiar
        </Button>
      </div>
    </div>
  )
}
