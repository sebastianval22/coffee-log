import { ArrowLeft, CircleCheck, Pencil, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Verdict } from '@/components/Verdict'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { Button } from '@/components/ui/button'
import { CupsSection } from '@/features/cups/CupsSection'
import { errorMessage } from '@/lib/errors'
import { PROCESS_LABELS, ROAST_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/text'
import { useBag, useDeleteBag, usePatchBag, type BagSummary } from './api'
import { FinishBagDialog } from './FinishBagDialog'

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

          <Verdict
            rating={bag.rating}
            tags={bag.flavor_tags}
            notes={bag.notes}
            footer={
              bag.would_buy_again === null
                ? undefined
                : bag.would_buy_again
                  ? 'La compraría de nuevo'
                  : 'No la compraría de nuevo'
            }
          />

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

          <CupsSection bagId={bag.id!} canLog={!bag.finished_at} />

          {bag.finished_at ? (
            <ReopenBagButton bag={bag} />
          ) : (
            <FinishBagDialog
              bag={bag}
              trigger={
                <Button variant="secondary">
                  <CircleCheck /> Terminé esta bolsa
                </Button>
              }
            />
          )}

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

function ReopenBagButton({ bag }: { bag: BagSummary }) {
  const patchBag = usePatchBag()
  return (
    <Button
      variant="secondary"
      disabled={patchBag.isPending}
      onClick={() =>
        patchBag.mutate(
          { id: bag.id!, fields: { finished_at: null, finish_prompt_snoozed_until: null } },
          { onSuccess: () => toast.success('Bolsa reabierta'), onError: (e) => toast.error(errorMessage(e)) },
        )
      }
    >
      <RotateCcw /> Reabrir
    </Button>
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
    <ConfirmDeleteButton
      title={`¿Borrar “${bag.name}”?`}
      description={`Se borran también su foto y ${bag.cup_count === 1 ? 'la taza registrada' : `las ${bag.cup_count} tazas registradas`}. No se puede deshacer.`}
      onConfirm={confirm}
      disabled={deleteBag.isPending}
    />
  )
}
