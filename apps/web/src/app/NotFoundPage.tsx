import { Link } from 'react-router'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function NotFoundPage() {
  return (
    <PagePlaceholder title="No encontrado">
      Esta página no existe. <Link to="/" className="underline">Volver al inicio</Link>
    </PagePlaceholder>
  )
}
