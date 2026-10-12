import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CreatableCombobox } from '@/components/CreatableCombobox'
import { PhotoPicker } from '@/components/PhotoPicker'
import { RatingInput } from '@/components/RatingInput'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFindOrCreateRoaster, useRoasters } from '@/features/roasters/api'
import type { ProcessedPhoto } from '@/lib/image'
import { ORIGIN_COUNTRIES, PROCESS_LABELS, ROAST_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { useFlavorTagSuggestions, type BagFields } from './api'
import { bagFormSchema, valuesToFields, type BagFormValues } from './bagFormValues'

type Props = {
  defaultValues: BagFormValues
  storedPhotoPath?: string
  submitLabel: string
  onSubmit: (fields: BagFields, photo: ProcessedPhoto | null) => Promise<void>
}

export function BagForm({ defaultValues, storedPhotoPath, submitLabel, onSubmit }: Props) {
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  const [photoError, setPhotoError] = useState<string>()
  const roasters = useRoasters()
  const findOrCreateRoaster = useFindOrCreateRoaster()
  const tagSuggestions = useFlavorTagSuggestions()
  const hasOpinion = defaultValues.rating !== null || defaultValues.flavorTags.length > 0 || !!defaultValues.notes

  const form = useForm<BagFormValues>({ resolver: zodResolver(bagFormSchema), defaultValues })
  const { register, control, formState } = form
  const errors = formState.errors

  const submit = form.handleSubmit(
    async (values) => {
      if (!photo && !storedPhotoPath) {
        setPhotoError('Agrega una foto de la bolsa')
        return
      }
      await onSubmit(valuesToFields(values), photo)
    },
    () => {
      if (!photo && !storedPhotoPath) setPhotoError('Agrega una foto de la bolsa')
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

      <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
        <Input id="name" placeholder="Ej: Yirgacheffe Konga" autoComplete="off" {...register('name')} />
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
          <Input id="originCountry" list="origin-countries" autoComplete="off" {...register('originCountry')} />
          <datalist id="origin-countries">
            {ORIGIN_COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Región" htmlFor="originRegion">
          <Input id="originRegion" autoComplete="off" {...register('originRegion')} />
        </Field>
        <Field label="Proceso" htmlFor="process">
          <NativeSelect id="process" options={PROCESS_LABELS} {...register('process')} />
        </Field>
        <Field label="Tostión" htmlFor="roastLevel">
          <NativeSelect id="roastLevel" options={ROAST_LABELS} {...register('roastLevel')} />
        </Field>
      </div>

      <Section title="Más detalles">
        <Field label="Finca" htmlFor="farm">
          <Input id="farm" autoComplete="off" {...register('farm')} />
        </Field>
        <Field label="Variedades" htmlFor="varieties">
          <Controller
            control={control}
            name="varieties"
            render={({ field }) => (
              <TagInput id="varieties" value={field.value} onChange={field.onChange} placeholder="Ej: Geisha, Bourbon" />
            )}
          />
        </Field>
        <Field label="Altitud (m)" htmlFor="altitude" error={errors.altitude?.message}>
          <Input id="altitude" inputMode="numeric" autoComplete="off" {...register('altitude')} />
        </Field>
        <Field label="Notas del empaque" htmlFor="labelNotes">
          <Controller
            control={control}
            name="labelNotes"
            render={({ field }) => (
              <TagInput id="labelNotes" value={field.value} onChange={field.onChange} placeholder="Ej: durazno, jazmín" />
            )}
          />
        </Field>
        <Field label="Fecha de apertura" htmlFor="openedAt" error={errors.openedAt?.message}>
          <Input id="openedAt" type="datetime-local" {...register('openedAt')} />
        </Field>
      </Section>

      <Section title="Tu opinión" defaultOpen={hasOpinion}>
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
        <Field label="¿La comprarías de nuevo?">
          <Controller
            control={control}
            name="wouldBuyAgain"
            render={({ field }) => <YesNo value={field.value} onChange={field.onChange} />}
          />
        </Field>
      </Section>

      <Button type="submit" size="lg" className="h-12 text-base" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-xl border bg-card">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 font-medium">
        {title}
        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

const NativeSelect = ({
  options,
  className,
  ...props
}: ComponentProps<'select'> & { options: Record<string, string> }) => (
  <select
    className={cn(
      'h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs md:text-sm',
      className,
    )}
    {...props}
  >
    <option value="">—</option>
    {Object.entries(options).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </select>
)

function YesNo({ value, onChange }: { value: boolean | null; onChange: (value: boolean | null) => void }) {
  const option = (label: string, v: boolean) => (
    <Button
      type="button"
      variant={value === v ? 'default' : 'outline'}
      className="flex-1"
      onClick={() => onChange(value === v ? null : v)}
    >
      {label}
    </Button>
  )
  return (
    <div className="flex gap-2">
      {option('Sí', true)}
      {option('No', false)}
    </div>
  )
}
