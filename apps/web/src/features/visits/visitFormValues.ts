import { z } from 'zod'
import type { Enums } from '@/lib/database.types'
import { blankToNull, toLocalInputValue } from '@/lib/text'
import type { VisitFields, VisitSummary } from './api'

export const visitFormSchema = z.object({
  cafeId: z.string({ error: 'Elige o crea la cafetería' }).nullable().refine(Boolean, 'Elige o crea la cafetería'),
  drink: z.string().min(1, '¿Qué tomaste?'),
  visitedAt: z.string().min(1, 'Indica la fecha'),
  rating: z.number().nullable(),
  flavorTags: z.array(z.string()),
  notes: z.string(),
  coffeeName: z.string(),
  roasterId: z.string().nullable(),
  originCountry: z.string(),
  process: z.string(),
})

export type VisitFormValues = z.infer<typeof visitFormSchema>

export function emptyVisitValues(): VisitFormValues {
  return {
    cafeId: null,
    drink: '',
    visitedAt: toLocalInputValue(new Date()),
    rating: null,
    flavorTags: [],
    notes: '',
    coffeeName: '',
    roasterId: null,
    originCountry: '',
    process: '',
  }
}

export function visitToValues(v: VisitSummary): VisitFormValues {
  return {
    cafeId: v.cafe_id,
    drink: v.drink ?? '',
    visitedAt: toLocalInputValue(v.visited_at ?? new Date()),
    rating: v.rating,
    flavorTags: v.flavor_tags ?? [],
    notes: v.notes ?? '',
    coffeeName: v.coffee_name ?? '',
    roasterId: v.roaster_id,
    originCountry: v.origin_country ?? '',
    process: v.process ?? '',
  }
}

export function valuesToFields(v: VisitFormValues): VisitFields {
  return {
    cafe_id: v.cafeId!,
    drink: v.drink as Enums<'method_t'>,
    visited_at: new Date(v.visitedAt).toISOString(),
    rating: v.rating,
    flavor_tags: v.flavorTags,
    notes: blankToNull(v.notes),
    coffee_name: blankToNull(v.coffeeName),
    roaster_id: v.roasterId,
    origin_country: blankToNull(v.originCountry),
    process: (v.process || null) as Enums<'process_t'> | null,
  }
}
