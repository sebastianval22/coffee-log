import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dateRange, type Filters } from '@/features/search/filters'
import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import type { ProcessedPhoto } from '@/lib/image'
import { createWithPhoto, deletePhoto, updateWithPhoto } from '@/lib/photos'
import { supabase } from '@/lib/supabase'

export type BagSummary = Tables<'bag_summary'>
export type BagFields = Omit<TablesInsert<'bags'>, 'id' | 'user_id' | 'photo_path' | 'search' | 'search_text'>

export const bagKeys = {
  all: ['bags'] as const,
  search: (filters: Filters, onlyOpen: boolean) => [...bagKeys.all, 'search', filters, onlyOpen] as const,
  open: () => [...bagKeys.all, 'open'] as const,
  detail: (id: string) => [...bagKeys.all, 'detail', id] as const,
}

/** "Cafés": text search (accent/typo tolerant, server side) plus filters and sorting. */
export function useBagSearch(filters: Filters, onlyOpen: boolean) {
  return useQuery({
    queryKey: bagKeys.search(filters, onlyOpen),
    placeholderData: (previous) => previous, // keep the grid while a new search loads
    queryFn: async () => {
      let query = supabase.rpc('search_bags', { q: filters.q }).select('*')
      if (onlyOpen) query = query.is('finished_at', null)
      if (filters.process) query = query.eq('process', filters.process as Enums<'process_t'>)
      if (filters.roast) query = query.eq('roast_level', filters.roast as Enums<'roast_t'>)
      if (filters.min) query = query.gte('rating', Number(filters.min))
      const { start, end } = dateRange(filters)
      if (start) query = query.gte('opened_at', start)
      if (end) query = query.lt('opened_at', end)
      if (filters.sort === 'rating') query = query.order('rating', { ascending: false, nullsFirst: false })
      const { data, error } = await query.order('opened_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Bags not finished yet, most recently opened first ("Abiertas ahora"). */
export function useOpenBags() {
  return useQuery({
    queryKey: bagKeys.open(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bag_summary')
        .select('*')
        .is('finished_at', null)
        .order('opened_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useBag(id: string) {
  return useQuery({
    queryKey: bagKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('bag_summary').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useCreateBag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fields, photo }: { fields: BagFields; photo: ProcessedPhoto }) =>
      createWithPhoto('bags', photo, (id, photo_path) =>
        supabase.from('bags').insert({ ...fields, id, photo_path }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bagKeys.all }),
  })
}

export function useUpdateBag(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fields,
      photo,
      currentPhotoPath,
    }: {
      fields: TablesUpdate<'bags'>
      photo: ProcessedPhoto | null
      currentPhotoPath: string
    }) =>
      updateWithPhoto('bags', id, currentPhotoPath, photo, (photo_path) =>
        supabase
          .from('bags')
          .update(photo_path ? { ...fields, photo_path } : fields)
          .eq('id', id),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bagKeys.all }),
  })
}

/** Small field updates without touching the photo: finish, reopen, snooze the finish prompt. */
export function usePatchBag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: TablesUpdate<'bags'> }) => {
      const { error } = await supabase.from('bags').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bagKeys.all }),
  })
}

export function useDeleteBag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bag: { id: string; photo_path: string }) => {
      // Cups go with the row (on delete cascade). The photo goes after, so a failure there
      // leaves at worst an orphan file, never a row pointing at a missing photo.
      const { error } = await supabase.from('bags').delete().eq('id', bag.id)
      if (error) throw error
      await deletePhoto(bag.photo_path).catch(() => {})
    },
    onSuccess: (_data, bag) => {
      queryClient.removeQueries({ queryKey: bagKeys.detail(bag.id) })
      return queryClient.invalidateQueries({ queryKey: bagKeys.all })
    },
  })
}
