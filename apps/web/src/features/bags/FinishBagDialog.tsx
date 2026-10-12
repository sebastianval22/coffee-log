import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Field } from '@/components/form'
import { RatingInput } from '@/components/RatingInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/lib/errors'
import { usePatchBag, type BagSummary } from './api'

type Props = {
  bag: BagSummary
  trigger: ReactNode
}

/** "Terminé esta bolsa": finish date plus the final verdict, all optional and prefilled. */
export function FinishBagDialog({ bag, trigger }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terminé “{bag.name}”</DialogTitle>
          <DialogDescription>Tu veredicto final. Todo es opcional.</DialogDescription>
        </DialogHeader>
        {open && <FinishForm bag={bag} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function FinishForm({ bag, onDone }: { bag: BagSummary; onDone: () => void }) {
  const patchBag = usePatchBag()
  const openedDay = toDateInput(new Date(bag.opened_at!))
  const [day, setDay] = useState(() => toDateInput(new Date()))
  const [rating, setRating] = useState<number | null>(bag.rating)
  const [wouldBuyAgain, setWouldBuyAgain] = useState<boolean | null>(bag.would_buy_again)
  const dayError = !day ? 'Indica la fecha' : day < openedDay ? 'No puede ser antes de que la abriste' : undefined

  async function save() {
    if (dayError) return
    try {
      await patchBag.mutateAsync({
        id: bag.id!,
        fields: { finished_at: finishedAt(day, bag.opened_at!), rating, would_buy_again: wouldBuyAgain },
      })
      toast.success('Bolsa terminada')
      onDone()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="¿Cuándo se terminó?" htmlFor="finishedDay" error={dayError}>
        <Input id="finishedDay" type="date" min={openedDay} value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <Field label="Rating final">
        <RatingInput value={rating} onChange={setRating} />
      </Field>
      <Field label="¿La comprarías de nuevo?">
        <div className="flex gap-2">
          {[
            ['Sí', true],
            ['No', false],
          ].map(([label, value]) => (
            <Button
              key={String(value)}
              type="button"
              variant={wouldBuyAgain === value ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setWouldBuyAgain(wouldBuyAgain === value ? null : (value as boolean))}
            >
              {label}
            </Button>
          ))}
        </div>
      </Field>
      <Button size="lg" onClick={save} disabled={patchBag.isPending || !!dayError}>
        {patchBag.isPending ? 'Guardando…' : 'Terminar bolsa'}
      </Button>
    </div>
  )
}

/** yyyy-mm-dd in the device's time zone. */
function toDateInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today → now; an earlier day → noon that day. Never before the opening timestamp. */
function finishedAt(day: string, openedAt: string) {
  const at = day === toDateInput(new Date()) ? new Date() : new Date(`${day}T12:00`)
  const opened = new Date(openedAt)
  return (at < opened ? opened : at).toISOString()
}
