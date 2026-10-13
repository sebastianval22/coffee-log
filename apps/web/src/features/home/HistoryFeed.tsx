import { Bean, CircleCheck, NotebookPen, Plus, Store, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Button } from '@/components/ui/button'
import type { Enums } from '@/lib/database.types'
import { METHOD_LABELS } from '@/lib/labels'
import { groupByDay } from './groupByDay'
import { eventKey, eventLink, useHistory, type HistoryEvent, type HistoryKind } from './historyApi'

const KINDS: Record<HistoryKind, { label: string; icon: LucideIcon }> = {
  bag_opened: { label: 'Abriste una bolsa', icon: Bean },
  bag_finished: { label: 'Terminaste una bolsa', icon: CircleCheck },
  tasting: { label: 'Cata', icon: NotebookPen },
  cafe_visit: { label: 'Cafetería', icon: Store },
}

const time = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' })

export function HistoryFeed() {
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useHistory()
  const sentinel = useRef<HTMLDivElement>(null)

  // Load the next page as the end of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const events = data?.pages.flat() ?? []
  const days = groupByDay(events, (e) => new Date(e.occurred_at!))

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Historial</h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">No se pudo cargar tu historial.</p>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-4">
          <p className="text-sm text-muted-foreground">
            Aquí aparecerán las bolsas que abras, tus catas y tus visitas a cafeterías.
          </p>
          <Button asChild size="sm">
            <Link to="/new">
              <Plus /> Registrar
            </Link>
          </Button>
        </div>
      ) : (
        days.map((day) => (
          <div key={day.key} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">{day.label}</h3>
            <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {day.items.map((event) => (
                <li key={eventKey(event)}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <div ref={sentinel} />
      {isFetchingNextPage ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      ) : (
        // Fallback for when the observer doesn't fire (and for keyboard users).
        hasNextPage && (
          <Button variant="outline" onClick={() => void fetchNextPage()}>
            Ver más
          </Button>
        )
      )}
    </section>
  )
}

function EventCard({ event }: { event: HistoryEvent }) {
  const kind = KINDS[event.kind as HistoryKind]
  // For tastings and visits the subtitle is a method/drink enum value; bags carry the roaster name.
  const subtitle =
    event.kind === 'tasting' || event.kind === 'cafe_visit'
      ? event.subtitle && METHOD_LABELS[event.subtitle as Enums<'method_t'>]
      : event.subtitle

  return (
    <Link
      to={eventLink(event)}
      className="flex items-center gap-3 rounded-2xl border bg-card p-2.5 shadow-sm transition hover:border-ring"
    >
      <StoredPhoto path={event.photo_path} variant="thumb" alt="" className="size-16 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <kind.icon className="size-3.5" />
          {kind.label} · {time.format(new Date(event.occurred_at!))}
        </span>
        <span className="truncate font-medium">{event.title}</span>
        {subtitle && <span className="truncate text-sm text-muted-foreground">{subtitle}</span>}
      </div>
      {event.rating !== null && <RatingStars value={event.rating} className="shrink-0" />}
    </Link>
  )
}
