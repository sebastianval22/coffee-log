import { ArrowLeft, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Verdict } from '@/components/Verdict'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { METHOD_LABELS, PROCESS_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/text'
import { useDeleteVisit, useVisit, type VisitSummary } from './api'

export function VisitDetailPage() {
  const { id = '' } = useParams()
  const { data: visit, isPending, isError } = useVisit(id)

  if (isPending) return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted" />
  if (isError || !visit) {
    return (
      <p className="text-muted-foreground">
        No encontramos esta visita.{' '}
        <Link to="/visits" className="underline">
          Ver todas
        </Link>
      </p>
    )
  }
  return <VisitDetail visit={visit} />
}

function VisitDetail({ visit }: { visit: VisitSummary }) {
  const navigate = useNavigate()
  const deleteVisit = useDeleteVisit()
  const facts: [string, ReactNode][] = [
    ['Café', visit.coffee_name],
    ['Tostador', visit.roaster_name],
    ['Origen', visit.origin_country],
    ['Proceso', visit.process && PROCESS_LABELS[visit.process]],
  ]

  async function remove() {
    try {
      await deleteVisit.mutateAsync({ id: visit.id!, photo_path: visit.photo_path! })
      toast.success('Visita borrada')
      navigate('/visits', { replace: true })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link to="/visits" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Cafeterías
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <StoredPhoto path={visit.photo_path} variant="full" alt={visit.cafe_name ?? ''} className="aspect-[4/5] rounded-2xl" />

        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{visit.cafe_name}</h1>
            <p className="text-lg text-muted-foreground">
              {visit.drink && METHOD_LABELS[visit.drink]}
              {visit.cafe_city && ` · ${visit.cafe_city}`}
            </p>
            <p className="text-sm text-muted-foreground">{formatDate(visit.visited_at!)}</p>
          </header>

          <Verdict rating={visit.rating} tags={visit.flavor_tags} notes={visit.notes} />

          {facts.some(([, value]) => value) && (
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
          )}

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/visits/${visit.id}/edit`}>
                <Pencil /> Editar
              </Link>
            </Button>
            <ConfirmDeleteButton
              title="¿Borrar esta visita?"
              description="Se borra también su foto. No se puede deshacer."
              onConfirm={remove}
              disabled={deleteVisit.isPending}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
