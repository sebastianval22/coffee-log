import { ChevronDown, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RatingStars } from '@/components/RatingInput'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { errorMessage } from '@/lib/errors'
import { METHOD_LABELS } from '@/lib/labels'
import { useCups, useDeleteCup, type Cup } from './api'
import { QuickCupButton } from './QuickCupButton'
import { TastingDialog } from './TastingDialog'

const dateTime = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

/** Bag detail: log cups, add tastings, and list them. Quick cups collapse into a counter. */
export function CupsSection({ bagId, canLog }: { bagId: string; canLog: boolean }) {
  const { data: cups = [] } = useCups(bagId)
  const tastings = cups.filter((c) => c.is_tasting)
  const quickCups = cups.filter((c) => !c.is_tasting)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Tazas</h2>
      {canLog && (
        <div className="flex gap-2">
          <QuickCupButton bagId={bagId} className="flex-1">
            <Plus /> 1 taza
          </QuickCupButton>
          <TastingDialog
            bagId={bagId}
            trigger={
              <Button variant="outline" className="flex-1">
                <NotebookPen /> Agregar cata
              </Button>
            }
          />
        </div>
      )}

      {tastings.length === 0 && quickCups.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no registras tazas de esta bolsa.</p>
      )}

      <ul className="flex flex-col gap-2">
        {tastings.map((cup) => (
          <li key={cup.id} className="flex flex-col gap-1.5 rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{cup.method ? METHOD_LABELS[cup.method] : 'Cata'}</span>
              <span className="text-muted-foreground">{dateTime.format(new Date(cup.drunk_at))}</span>
              <CupActions bagId={bagId} cup={cup} />
            </div>
            {cup.rating !== null && <RatingStars value={cup.rating} />}
            {cup.flavor_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cup.flavor_tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {cup.notes && <p className="text-sm whitespace-pre-line">{cup.notes}</p>}
          </li>
        ))}
      </ul>

      {quickCups.length > 0 && (
        <Collapsible className="rounded-xl border bg-card">
          <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-sm">
            <span>
              {quickCups.length === 1 ? '1 taza rápida' : `${quickCups.length} tazas rápidas`}
              {tastings.length > 0 && <span className="text-muted-foreground"> · sin detalle</span>}
            </span>
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="divide-y border-t">
              {quickCups.map((cup) => (
                <li key={cup.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{dateTime.format(new Date(cup.drunk_at))}</span>
                  <CupActions bagId={bagId} cup={cup} />
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  )
}

function CupActions({ bagId, cup }: { bagId: string; cup: Cup }) {
  const deleteCup = useDeleteCup()
  const remove = () =>
    deleteCup.mutate(
      { id: cup.id, bagId },
      {
        onSuccess: () => toast.success(cup.is_tasting ? 'Cata borrada' : 'Taza borrada'),
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  const deleteButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={cup.is_tasting ? 'Borrar cata' : 'Borrar taza'}
      className="text-muted-foreground hover:text-destructive"
      onClick={cup.is_tasting ? undefined : remove}
    >
      <Trash2 />
    </Button>
  )

  return (
    <span className="ml-auto flex gap-1">
      <TastingDialog
        bagId={bagId}
        cup={cup}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={cup.is_tasting ? 'Editar cata' : 'Agregar detalle'}>
            <Pencil />
          </Button>
        }
      />
      {cup.is_tasting ? (
        // A tasting carries notes worth confirming before losing; a quick cup doesn't.
        <AlertDialog>
          <AlertDialogTrigger asChild>{deleteButton}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Borrar esta cata?</AlertDialogTitle>
              <AlertDialogDescription>Se pierden su rating, sabores y notas. No se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={remove}>
                Borrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        deleteButton
      )}
    </span>
  )
}
