import type { ReactNode } from 'react'

export function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{children ?? 'Próximamente.'}</p>
    </section>
  )
}
