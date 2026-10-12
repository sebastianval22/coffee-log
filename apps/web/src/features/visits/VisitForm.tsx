import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CreatableCombobox } from '@/components/CreatableCombobox'
import { Field, NativeSelect, Section } from '@/components/form'
import { PhotoPicker } from '@/components/PhotoPicker'
import { RatingInput } from '@/components/RatingInput'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCafes, useFindOrCreateCafe } from '@/features/cafes/api'
import { useFindOrCreateRoaster, useRoasters } from '@/features/roasters/api'
import { useFlavorTagSuggestions } from '@/features/tags/api'
import type { ProcessedPhoto } from '@/lib/image'
import { METHOD_LABELS, ORIGIN_COUNTRIES, PROCESS_LABELS } from '@/lib/labels'
import type { VisitFields } from './api'
import { valuesToFields, visitFormSchema, type VisitFormValues } from './visitFormValues'

type Props = {
  defaultValues: VisitFormValues
  storedPhotoPath?: string
  submitLabel: string
  onSubmit: (fields: VisitFields, photo: ProcessedPhoto | null) => Promise<void>
}

export function VisitForm({ defaultValues, storedPhotoPath, submitLabel, onSubmit }: Props) {
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  const [photoError, setPhotoError] = useState<string>()
  const cafes = useCafes()
  const findOrCreateCafe = useFindOrCreateCafe()
  const roasters = useRoasters()
  const findOrCreateRoaster = useFindOrCreateRoaster()
  const tagSuggestions = useFlavorTagSuggestions()
  const knowsCoffee = !!(defaultValues.coffeeName || defaultValues.roasterId || defaultValues.originCountry || defaultValues.process)

  const form = useForm<VisitFormValues>({ resolver: zodResolver(visitFormSchema), defaultValues })
  const { register, control, formState } = form
  const errors = formState.errors
  const missingPhoto = () => !photo && !storedPhotoPath

  const submit = form.handleSubmit(
    async (values) => {
      if (missingPhoto()) return setPhotoError('Agrega una foto de lo que tomaste')
      await onSubmit(valuesToFields(values), photo)
    },
    () => {
      if (missingPhoto()) setPhotoError('Agrega una foto de lo que tomaste')
    },
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <PhotoPicker
        value={photo}
        onChange={(p) => {
          setPhoto(p)
          setPhotoError(undefined)
        }}
        storedPath={storedPhotoPath}
        error={photoError}
      />

      <Field label="Cafetería" htmlFor="cafe" error={errors.cafeId?.message}>
        <Controller
          control={control}
          name="cafeId"
          render={({ field }) => (
            <CreatableCombobox
              id="cafe"
              items={(cafes.data ?? []).map((c) => ({ id: c.id, label: c.name, detail: c.city }))}
              value={field.value}
              onChange={field.onChange}
              onCreate={(input) => findOrCreateCafe.mutateAsync(input)}
              placeholder="Elegir o crear cafetería"
              searchPlaceholder="Nombre, ciudad"
            />
          )}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Qué tomaste" htmlFor="drink" error={errors.drink?.message}>
          <NativeSelect id="drink" options={METHOD_LABELS} {...register('drink')} />
        </Field>
        <Field label="Cuándo" htmlFor="visitedAt" error={errors.visitedAt?.message}>
          <Input id="visitedAt" type="datetime-local" {...register('visitedAt')} />
        </Field>
      </div>

      <Field label="Rating">
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} />}
        />
      </Field>
      <Field label="Lo que sentiste" htmlFor="flavorTags">
        <Controller
          control={control}
          name="flavorTags"
          render={({ field }) => (
            <TagInput
              id="flavorTags"
              value={field.value}
              onChange={field.onChange}
              suggestions={tagSuggestions.data}
              placeholder="Ej: chocolate, cítrico"
            />
          )}
        />
      </Field>
      <Field label="Notas" htmlFor="notes">
        <Textarea id="notes" rows={3} {...register('notes')} />
      </Field>

      <Section title="Sé qué café era" defaultOpen={knowsCoffee}>
        <Field label="Nombre del café" htmlFor="coffeeName">
          <Input id="coffeeName" autoComplete="off" {...register('coffeeName')} />
        </Field>
        <Field label="Tostador" htmlFor="roaster">
          <Controller
            control={control}
            name="roasterId"
            render={({ field }) => (
              <CreatableCombobox
                id="roaster"
                items={(roasters.data ?? []).map((r) => ({ id: r.id, label: r.name, detail: r.city }))}
                value={field.value}
                onChange={field.onChange}
                onCreate={(name) => findOrCreateRoaster.mutateAsync(name)}
                placeholder="Elegir o crear tostador"
                searchPlaceholder="Buscar tostador…"
              />
            )}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="País de origen" htmlFor="originCountry">
            <Input id="originCountry" list="visit-origin-countries" autoComplete="off" {...register('originCountry')} />
            <datalist id="visit-origin-countries">
              {ORIGIN_COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Proceso" htmlFor="process">
            <NativeSelect id="process" options={PROCESS_LABELS} {...register('process')} />
          </Field>
        </div>
      </Section>

      <Button type="submit" size="lg" className="h-12 text-base" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
