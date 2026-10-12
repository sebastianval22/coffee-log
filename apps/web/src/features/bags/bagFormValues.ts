import { z } from 'zod'
import type { Enums } from '@/lib/database.types'
import { blankToNull, toLocalInputValue } from '@/lib/text'
import type { BagFields, BagSummary } from './api'

export const bagFormSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre'),
  roasterId: z.string().nullable(),
  originCountry: z.string(),
  originRegion: z.string(),
  farm: z.string(),
  varieties: z.array(z.string()),
  process: z.string(),
  roastLevel: z.string(),
  altitude: z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 3500), 'Entre 0 y 3500 m'),
  labelNotes: z.array(z.string()),
  openedAt: z.string().min(1, 'Indica la fecha'),
  rating: z.number().nullable(),
  flavorTags: z.array(z.string()),
  notes: z.string(),
  wouldBuyAgain: z.boolean().nullable(),
})

export type BagFormValues = z.infer<typeof bagFormSchema>

export function emptyBagValues(): BagFormValues {
  return {
    name: '',
    roasterId: null,
    originCountry: '',
    originRegion: '',
    farm: '',
    varieties: [],
    process: '',
    roastLevel: '',
    altitude: '',
    labelNotes: [],
    openedAt: toLocalInputValue(new Date()),
    rating: null,
    flavorTags: [],
    notes: '',
    wouldBuyAgain: null,
  }
}

export function bagToValues(bag: BagSummary): BagFormValues {
  return {
    name: bag.name ?? '',
    roasterId: bag.roaster_id,
    originCountry: bag.origin_country ?? '',
    originRegion: bag.origin_region ?? '',
    farm: bag.farm ?? '',
    varieties: bag.varieties ?? [],
    process: bag.process ?? '',
    roastLevel: bag.roast_level ?? '',
    altitude: bag.altitude_m?.toString() ?? '',
    labelNotes: bag.label_notes ?? [],
    openedAt: toLocalInputValue(bag.opened_at ?? new Date()),
    rating: bag.rating,
    flavorTags: bag.flavor_tags ?? [],
    notes: bag.notes ?? '',
    wouldBuyAgain: bag.would_buy_again,
  }
}

export function valuesToFields(v: BagFormValues): BagFields {
  return {
    name: v.name.trim(),
    roaster_id: v.roasterId,
    origin_country: blankToNull(v.originCountry),
    origin_region: blankToNull(v.originRegion),
    farm: blankToNull(v.farm),
    varieties: v.varieties,
    process: (v.process || null) as Enums<'process_t'> | null,
    roast_level: (v.roastLevel || null) as Enums<'roast_t'> | null,
    altitude_m: v.altitude ? Number(v.altitude) : null,
    label_notes: v.labelNotes,
    opened_at: new Date(v.openedAt).toISOString(),
    rating: v.rating,
    flavor_tags: v.flavorTags,
    notes: blankToNull(v.notes),
    would_buy_again: v.wouldBuyAgain,
  }
}
