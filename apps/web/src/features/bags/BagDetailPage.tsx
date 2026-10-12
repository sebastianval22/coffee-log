import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { RatingStars } from '@/components/RatingInput'
import { StoredPhoto } from '@/components/StoredPhoto'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { PROCESS_LABELS, ROAST_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/text'
import { useBag, useDeleteBag, type BagSummary } from './api'

export function BagDetailPage() {
  const { id = '' } = useParams()
  const { data: bag, isPending, isError } = useBag(id)

  if (isPending) return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted" />
  if (isError || !bag) {
    return (
      <p className="text-muted-foreground">
        No encontramos esta bolsa.{' '}
        <Link to="/bags" className="underline">
          Ver todas
        </Link>
      </p>
    )
  }
  return <BagDetail bag={bag} />
}

function BagDetail({ bag }: { bag: BagSummary }) {
  const origin = [bag.origin_region, bag.origin_country].filter(Boolean).join(', ')
  const facts: [string, ReactNode][] = [
    ['Origen', origin],
    ['Finca', bag.farm],
    ['Variedades', bag.varieties?.join(', ')],
    ['Proceso', bag.process && PROCESS_LABELS[bag.process]],
    ['Tostión', bag.roast_level && ROAST_LABELS[bag.roast_level]],
    ['Altitud', bag.altitude_m && `${bag.altitude_m} m`],
    ['Notas del empaque', bag.label_notes?.join(', ')],
  ]

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link to="/bags" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cafés
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <StoredPhoto path={bag.photo_path} variant="full" alt={bag.name ?? ''} className="aspect-[4/5] rounded-2xl" />

        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{bag.name}</h1>
            {bag.roaster_name && <p className="text-lg text-muted-foreground">{bag.roaster_name}</p>}
            <p className="text-sm text-muted-foreground">
              {bag.finished_at
                ? `Abierta el ${formatDate(bag.opened_at!)} · terminada el ${formatDate(bag.finished_at)}`
                : `Abierta desde el ${formatDate(bag.opened_at!)}`}
              {' · '}
              {bag.cup_count === 1 ? '1 taza' : `${bag.cup_count ?? 0} tazas`}
            </p>
          </header>

          <Verdict bag={bag} />

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {facts
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/bags/${bag.id}/edit`}>
                <Pencil /> Editar
              </Link>
            </Button>
            <DeleteBagButton bag={bag} />
          </div>
        </div>
      </div>
    </article>
  )
}

function Verdict({ bag }: { bag: BagSummary }) {
  const hasVerdict =
    bag.rating !== null || (bag.flavor_tags?.length ?? 0) > 0 || bag.notes || bag.would_buy_again !== null
  if (!hasVerdict) return null

  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      {bag.rating !== null && (
        <div className="flex items-center gap-2">
          <RatingStars value={bag.rating} />
          <span className="text-sm font-medium">{bag.rating.toFixed(1)}</span>
        </div>
      )}
      {(bag.flavor_tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bag.flavor_tags!.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {bag.notes && <p className="text-sm whitespace-pre-line">{bag.notes}</p>}
      {bag.would_buy_again !== null && (
        <p className="text-sm text-muted-foreground">
          {bag.would_buy_again ? 'La compraría de nuevo' : 'No la compraría de nuevo'}
        </p>
      )}
    </section>
  )
}

function DeleteBagButton({ bag }: { bag: BagSummary }) {
  const navigate = useNavigate()
  const deleteBag = useDeleteBag()

  async function confirm() {
    try {
      await deleteBag.mutateAsync({ id: bag.id!, photo_path: bag.photo_path! })
      toast.success('Bolsa borrada')
      navigate('/bags', { replace: true })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
          <Trash2 /> Borrar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar “{bag.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran también su foto y {bag.cup_count === 1 ? 'la taza registrada' : `las ${bag.cup_count} tazas registradas`}.
            No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={deleteBag.isPending}>
            Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
