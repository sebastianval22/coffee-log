import { isSupabaseConfigured } from './lib/supabase'

function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-4 text-center">
      <img src="/logo.svg" alt="" className="size-24 rounded-3xl shadow-lg" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Coffee Log</h1>
        <p className="text-espresso/70">Registra los cafés que pruebas.</p>
      </div>
      <button
        type="button"
        disabled
        className="w-full rounded-2xl bg-espresso px-6 py-4 text-lg font-semibold text-milk disabled:opacity-50"
      >
        Registrar café (pronto)
      </button>
      <p className="text-xs text-espresso/50">
        Supabase: {isSupabaseConfigured ? 'configurado' : 'sin configurar'}
      </p>
    </main>
  )
}

export default App
