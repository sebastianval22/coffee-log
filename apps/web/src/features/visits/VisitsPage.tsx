import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Tabs } from '@/components/Tabs'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/features/search/FilterBar'
import { activeFilterCount, useUrlFilters } from '@/features/search/filters'
import { METHOD_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/text'
import { cn } from '@/lib/utils'
import { useVisitSearch, type VisitSummary } from './api'

export function VisitsPage() {
  const { filters, params, update, clear } = useUrlFilters(['group'])
  const grouped = params.get('group') === 'cafe'
  const { data: visits, isPending, isError, isPlaceholderData } = useVisitSearch(filters)
  const filtering = Boolean(filters.q) || activeFilterCount(filters) > 0

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cafeterías</h1>
        <Tabs
          value={grouped ? 'cafe' : 'visits'}
          onChange={(view) => update({ group: view === 'cafe' ? 'cafe' : undefined })}
          options={[
            ['visits', 'Visitas'],
            ['cafe', 'Por cafetería'],
          ]}
        />
      </div>

      <FilterBar
        filters={filters}
        onChange={update}
        onClear={clear}
        placeholder="Buscar cafetería, café, origen…"
        dateLabel="Visitada"
      />

      {isPending ? (
        <Grid>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </Grid>
      ) : isError ? (
        <p className="text-muted-foreground">No se pudieron cargar tus visitas.</p>
      ) : visits.length === 0 ? (
        filtering ? (
          <p className="text-muted-foreground">Ninguna visita coincide con la búsqueda.</p>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">Todavía no registras visitas a cafeterías.</p>
            <Button asChild>
              <Link to="/new/visit">
                <Plus /> Estoy en una cafetería
              </Link>
            </Button>
          </div>
        )
      ) : (
        <div className={cn('flex flex-col gap-6 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {filtering && (
            <p className="-mb-3 text-sm text-muted-foreground">
              {visits.length === 1 ? '1 visita' : `${visits.length} visitas`}
            </p>
          )}
          {grouped ? (
            groupByCafe(visits).map((group) => (
              <div key={group.cafeId} className="flex flex-col gap-3">
                <h2 className="font-semibold">
                  {group.name}
                  {group.city && <span className="font-normal text-muted-foreground"> · {group.city}</span>}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {group.visits.length === 1 ? '1 visita' : `${group.visits.length} visitas`}
                  </span>
                </h2>
                <Grid>
                  {group.visits.map((visit) => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </Grid>
              </div>
            ))
          ) : (
            <Grid>
              {visits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </Grid>
          )}
        </div>
      )}
    </section>
  )
}

/** Groups visits by café, ordered by each café's first visit in the current sort. */
function groupByCafe(visits: VisitSummary[]) {
  const groups = new Map<string, { cafeId: string; name: string; city: string | null; visits: VisitSummary[] }>()
  for (const visit of visits) {
    const id = visit.cafe_id!
    const group = groups.get(id) ?? { cafeId: id, name: visit.cafe_name ?? '', city: visit.cafe_city, visits: [] }
    group.visits.push(visit)
    groups.set(id, group)
  }
  return [...groups.values()]
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
