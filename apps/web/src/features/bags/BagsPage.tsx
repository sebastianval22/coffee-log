import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Button } from '@/components/ui/button'
import { useBags, type BagSummary } from './api'

// Search, filters and the Open/All tabs arrive with #9.
export function BagsPage() {
  const { data: bags, isPending, isError } = useBags()

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cafés</h1>
      {isPending ? (
        <Grid>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </Grid>
      ) : isError ? (
        <p className="text-muted-foreground">No se pudieron cargar tus bolsas.</p>
      ) : bags.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">Todavía no registras ninguna bolsa.</p>
          <Button asChild>
            <Link to="/new/bag">
              <Plus /> Abrí una bolsa
            </Link>
          </Button>
        </div>
      ) : (
        <Grid>
          {bags.map((bag) => (
            <BagCard key={bag.id} bag={bag} />
          ))}
        </Grid>
      )}
    </section>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{children}</div>
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
