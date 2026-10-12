import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables, TablesInsert } from '@/lib/database.types'
import type { ProcessedPhoto } from '@/lib/image'
import { createWithPhoto, deletePhoto, updateWithPhoto } from '@/lib/photos'
import { supabase } from '@/lib/supabase'

export type VisitSummary = Tables<'cafe_visit_summary'>
export type VisitFields = Omit<TablesInsert<'cafe_visits'>, 'id' | 'user_id' | 'photo_path' | 'search' | 'search_text'>

export const visitKeys = {
  all: ['visits'] as const,
  list: () => [...visitKeys.all, 'list'] as const,
  detail: (id: string) => [...visitKeys.all, 'detail', id] as const,
}

export function useVisits() {
  return useQuery({
    queryKey: visitKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafe_visit_summary')
        .select('*')
        .order('visited_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: visitKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('cafe_visit_summary').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fields, photo }: { fields: VisitFields; photo: ProcessedPhoto }) =>
      createWithPhoto('visits', photo, (id, photo_path) =>
        supabase.from('cafe_visits').insert({ ...fields, id, photo_path }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  })
}

export function useUpdateVisit(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      fields,
      photo,
      currentPhotoPath,
    }: {
      fields: VisitFields
      photo: ProcessedPhoto | null
      currentPhotoPath: string
    }) =>
      updateWithPhoto('visits', id, currentPhotoPath, photo, (photo_path) =>
        supabase
          .from('cafe_visits')
          .update(photo_path ? { ...fields, photo_path } : fields)
          .eq('id', id),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (visit: { id: string; photo_path: string }) => {
      const { error } = await supabase.from('cafe_visits').delete().eq('id', visit.id)
      if (error) throw error
      await deletePhoto(visit.photo_path).catch(() => {})
    },
    onSuccess: (_data, visit) => {
      queryClient.removeQueries({ queryKey: visitKeys.detail(visit.id) })
      return queryClient.invalidateQueries({ queryKey: visitKeys.all })
    },
  })
}
