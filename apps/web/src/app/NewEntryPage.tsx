import { Bean, Store, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

const OPTIONS: { to: string; title: string; description: string; icon: LucideIcon }[] = [
  { to: '/new/bag', title: 'Abrí una bolsa', description: 'Foto del empaque y sus datos', icon: Bean },
  { to: '/new/visit', title: 'Estoy en una cafetería', description: 'Foto de lo que te sirvieron', icon: Store },
]

export function NewEntryPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Registrar</h1>
      {OPTIONS.map((option) => (
        <Link
          key={option.to}
          to={option.to}
          className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-ring active:scale-[0.98]"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
            <option.icon className="size-6" />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-semibold">{option.title}</span>
            <span className="text-sm text-muted-foreground">{option.description}</span>
          </span>
        </Link>
      ))}
    </section>
  )
}
