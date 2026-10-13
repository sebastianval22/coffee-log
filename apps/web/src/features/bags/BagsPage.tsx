import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Tabs } from '@/components/Tabs'
import { Button } from '@/components/ui/button'
import { FilterBar } from '@/features/search/FilterBar'
import { activeFilterCount, useUrlFilters } from '@/features/search/filters'
import { cn } from '@/lib/utils'
import { useBagSearch, type BagSummary } from './api'

export function BagsPage() {
  const { filters, params, update, clear } = useUrlFilters(['tab'])
  const onlyOpen = params.get('tab') === 'open'
  const { data: bags, isPending, isError, isPlaceholderData } = useBagSearch(filters, onlyOpen)
  const filtering = Boolean(filters.q) || activeFilterCount(filters) > 0 || onlyOpen

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cafés</h1>
        <Tabs
          value={onlyOpen ? 'open' : 'all'}
          onChange={(tab) => update({ tab: tab === 'open' ? 'open' : undefined })}
          options={[
            ['all', 'Todas'],
            ['open', 'Abiertas'],
          ]}
        />
      </div>

      <FilterBar
        filters={filters}
        onChange={update}
        onClear={clear}
        placeholder="Buscar por nombre, tostador, origen…"
        dateLabel="Abierta"
        showRoast
      />

      {isPending ? (
        <Grid>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </Grid>
      ) : isError ? (
        <p className="text-muted-foreground">No se pudieron cargar tus bolsas.</p>
      ) : bags.length === 0 ? (
        filtering ? (
          <p className="text-muted-foreground">Ninguna bolsa coincide con la búsqueda.</p>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">Todavía no registras ninguna bolsa.</p>
            <Button asChild>
              <Link to="/new/bag">
                <Plus /> Abrí una bolsa
              </Link>
            </Button>
          </div>
        )
      ) : (
        <>
          {filtering && (
            <p className="text-sm text-muted-foreground">
              {bags.length === 1 ? '1 bolsa' : `${bags.length} bolsas`}
            </p>
          )}
          <Grid className={cn(isPlaceholderData && 'opacity-60')}>
            {bags.map((bag) => (
              <BagCard key={bag.id} bag={bag} />
            ))}
          </Grid>
        </>
      )}
    </section>
  )
}

function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 lg:grid-cols-4', className)}>
      {children}
    </div>
  )
}

function BagCard({ bag }: { bag: BagSummary }) {
  return (
    <Link to={`/bags/${bag.id}`} className="group flex flex-col gap-2">
      <div className="relative">
        <StoredPhoto
          path={bag.photo_path}
          variant="thumb"
          alt={bag.name ?? ''}
          className="aspect-[4/5] rounded-2xl transition group-hover:opacity-90"
        />
        {!bag.finished_at && (
          <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
            Abierta
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="truncate font-medium">{bag.name}</span>
        {bag.roaster_name && <span className="truncate text-sm text-muted-foreground">{bag.roaster_name}</span>}
        {bag.rating !== null && <RatingStars value={bag.rating} className="mt-0.5" />}
      </div>
    </Link>
  )
}
