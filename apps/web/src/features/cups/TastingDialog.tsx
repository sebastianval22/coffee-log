import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Field, NativeSelect } from '@/components/form'
import { RatingInput } from '@/components/RatingInput'
import { TagInput } from '@/components/TagInput'
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
import { Textarea } from '@/components/ui/textarea'
import { useFlavorTagSuggestions } from '@/features/bags/api'
import type { Enums } from '@/lib/database.types'
import { errorMessage } from '@/lib/errors'
import { METHOD_LABELS } from '@/lib/labels'
import { blankToNull, toLocalInputValue } from '@/lib/text'
import { useCreateTasting, useUpdateCup, type Cup, type CupFields } from './api'

const schema = z
  .object({
    drunkAt: z.string().min(1, 'Indica la fecha'),
    method: z.string(),
    rating: z.number().nullable(),
    flavorTags: z.array(z.string()),
    notes: z.string(),
  })
  // Without any detail it would just be a quick cup and vanish from the history.
  .refine((v) => v.method || v.rating !== null || v.flavorTags.length > 0 || v.notes.trim(), {
    message: 'Agrega al menos un detalle: método, rating, sabores o notas.',
    path: ['notes'],
  })

type Values = z.infer<typeof schema>

type Props = {
  bagId: string
  /** Existing cup to edit (a tasting, or a quick cup being completed). Omit to add a new tasting. */
  cup?: Cup
  trigger: ReactNode
}

export function TastingDialog({ bagId, cup, trigger }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cup?.is_tasting ? 'Editar cata' : 'Agregar cata'}</DialogTitle>
          <DialogDescription>Cómo te salió esta taza.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from fresh values. */}
        {open && <TastingForm bagId={bagId} cup={cup} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function TastingForm({ bagId, cup, onDone }: { bagId: string; cup?: Cup; onDone: () => void }) {
  const createTasting = useCreateTasting(bagId)
  const updateCup = useUpdateCup(bagId)
  const tagSuggestions = useFlavorTagSuggestions()
  // Computed once (lazy state): a new tasting defaults to the moment the form opened.
  const [defaultValues] = useState<Values>(() => ({
    drunkAt: toLocalInputValue(cup?.drunk_at ?? new Date()),
    method: cup?.method ?? '',
    rating: cup?.rating ?? null,
    flavorTags: cup?.flavor_tags ?? [],
    notes: cup?.notes ?? '',
  }))
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues })
  const { register, control, formState } = form

  const submit = form.handleSubmit(async (v) => {
    const fields: CupFields = {
      drunk_at: new Date(v.drunkAt).toISOString(),
      method: (v.method || null) as Enums<'method_t'> | null,
      rating: v.rating,
      flavor_tags: v.flavorTags,
      notes: blankToNull(v.notes),
    }
    try {
      if (cup) await updateCup.mutateAsync({ id: cup.id, fields })
      else await createTasting.mutateAsync(fields)
      toast.success('Cata guardada')
      onDone()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cuándo" htmlFor="drunkAt" error={formState.errors.drunkAt?.message}>
          <Input id="drunkAt" type="datetime-local" {...register('drunkAt')} />
        </Field>
        <Field label="Método" htmlFor="method">
          <NativeSelect id="method" options={METHOD_LABELS} {...register('method')} />
        </Field>
      </div>
      <Field label="Rating">
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <Field label="Lo que sentiste" htmlFor="tastingTags">
        <Controller
          control={control}
          name="flavorTags"
          render={({ field }) => (
            <TagInput
              id="tastingTags"
              value={field.value}
              onChange={field.onChange}
              suggestions={tagSuggestions.data}
              placeholder="Ej: chocolate, cítrico"
            />
          )}
        />
      </Field>
      <Field label="Notas" htmlFor="tastingNotes" error={formState.errors.notes?.message}>
        <Textarea id="tastingNotes" rows={3} placeholder="Ej: 15 g, 250 ml, molienda media" {...register('notes')} />
      </Field>
      <Button type="submit" size="lg" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Guardando…' : 'Guardar cata'}
      </Button>
    </form>
  )
}
