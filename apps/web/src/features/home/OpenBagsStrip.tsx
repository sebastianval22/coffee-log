import { Bean } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { StoredPhoto } from '@/components/StoredPhoto'
import { Button } from '@/components/ui/button'
import { useOpenBags, usePatchBag, type BagSummary } from '@/features/bags/api'
import { FinishBagDialog } from '@/features/bags/FinishBagDialog'
import { shouldAskIfFinished, snoozedUntil } from '@/features/bags/finishPrompt'
import { QuickCupButton } from '@/features/cups/QuickCupButton'
import { errorMessage } from '@/lib/errors'

/** "Abiertas ahora": every open bag with a one-tap +1. */
export function OpenBagsStrip() {
  const { data: bags, isPending } = useOpenBags()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Abiertas ahora</h2>
      {isPending ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      ) : !bags?.length ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed p-4">
          <Bean className="size-6 text-muted-foreground" />
          <p className="flex-1 text-sm text-muted-foreground">No tienes bolsas abiertas.</p>
          <Button asChild size="sm">
            <Link to="/new/bag">Abrí una bolsa</Link>
          </Button>
        </div>
      ) : (
        // A horizontal strip on the phone, a grid on wider screens.
        <ul className="-mx-4 flex snap-x items-start gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:px-0 lg:grid-cols-3">
          {bags.map((bag) => (
            <li key={bag.id} className="w-[85%] shrink-0 snap-start only:w-full md:w-auto">
              <OpenBagCard bag={bag} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OpenBagCard({ bag }: { bag: BagSummary }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border bg-card p-2.5 shadow-sm">
      <div className="flex items-center gap-3">
        <Link to={`/bags/${bag.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <StoredPhoto path={bag.photo_path} variant="thumb" alt="" className="size-16 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{bag.name}</span>
            {bag.roaster_name && <span className="truncate text-sm text-muted-foreground">{bag.roaster_name}</span>}
            <span className="text-xs text-muted-foreground">
              {bag.cup_count === 1 ? '1 taza' : `${bag.cup_count ?? 0} tazas`}
            </span>
          </div>
        </Link>
        <QuickCupButton bagId={bag.id!} className="h-12 shrink-0 gap-1.5 rounded-xl px-3.5 text-base" />
      </div>
      {shouldAskIfFinished(bag) && <FinishPrompt bag={bag} />}
    </div>
  )
}

function FinishPrompt({ bag }: { bag: BagSummary }) {
  const patchBag = usePatchBag()
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary p-2.5">
      <span className="text-sm font-medium">¿Ya terminaste esta bolsa?</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={patchBag.isPending}
          onClick={() =>
            patchBag.mutate(
              { id: bag.id!, fields: { finish_prompt_snoozed_until: snoozedUntil().toISOString() } },
              { onError: (e) => toast.error(errorMessage(e)) },
            )
          }
        >
          Todavía no
        </Button>
        <FinishBagDialog bag={bag} trigger={<Button size="sm" className="flex-1">Sí, terminé</Button>} />
      </div>
    </div>
  )
}
