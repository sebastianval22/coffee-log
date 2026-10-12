import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useAddQuickCup, useDeleteCup } from './api'

const UNDO_WINDOW_MS = 5000

/** "+1": logs a cup right now, with a few seconds to undo. */
export function QuickCupButton({
  bagId,
  className,
  children = (
    <>
      <Plus /> 1
    </>
  ),
}: {
  bagId: string
  className?: string
  children?: ReactNode
}) {
  const addCup = useAddQuickCup()
  const deleteCup = useDeleteCup()

  async function log() {
    try {
      const cupId = await addCup.mutateAsync(bagId)
      toast.success('Taza registrada', {
        duration: UNDO_WINDOW_MS,
        action: {
          label: 'Deshacer',
          onClick: () =>
            deleteCup.mutate({ id: cupId, bagId }, { onError: (e) => toast.error(errorMessage(e)) }),
        },
      })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Button
      type="button"
      onClick={(e) => {
        e.preventDefault() // the button may sit inside a card link
        void log()
      }}
      className={cn('font-semibold', className)}
      aria-label="Registrar una taza"
    >
      {children}
    </Button>
  )
}
