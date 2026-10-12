import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Button } from '@/components/ui/button'
import { METHOD_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/text'
import { useVisits, type VisitSummary } from './api'

// Search, filters and grouping by café arrive with #9.
export function VisitsPage() {
  const { data: visits, isPending, isError } = useVisits()

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cafeterías</h1>
      {isPending ? (
        <Grid>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </Grid>
      ) : isError ? (
        <p className="text-muted-foreground">No se pudieron cargar tus visitas.</p>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">Todavía no registras visitas a cafeterías.</p>
          <Button asChild>
            <Link to="/new/visit">
              <Plus /> Estoy en una cafetería
            </Link>
          </Button>
        </div>
      ) : (
        <Grid>
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </Grid>
      )}
    </section>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{children}</div>
}

function VisitCard({ visit }: { visit: VisitSummary }) {
  return (
    <Link to={`/visits/${visit.id}`} className="group flex flex-col gap-2">
      <StoredPhoto
        path={visit.photo_path}
        variant="thumb"
        alt={visit.cafe_name ?? ''}
        className="aspect-[4/5] rounded-2xl transition group-hover:opacity-90"
      />
      <div className="flex flex-col">
        <span className="truncate font-medium">{visit.cafe_name}</span>
        <span className="truncate text-sm text-muted-foreground">
          {visit.drink && METHOD_LABELS[visit.drink]} · {formatDate(visit.visited_at!)}
        </span>
        {visit.rating !== null && <RatingStars value={visit.rating} className="mt-0.5" />}
      </div>
    </Link>
  )
}
