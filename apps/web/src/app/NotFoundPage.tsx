import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">No encontrado</h1>
      <p className="text-muted-foreground">
        Esta página no existe.{' '}
        <Link to="/" className="underline">
          Volver al inicio
        </Link>
      </p>
    </section>
  )
}
