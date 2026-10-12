import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import type { ProcessedPhoto } from '@/lib/image'
import { deletePhoto, newPhotoPath, uploadPhoto } from '@/lib/photos'
import { supabase } from '@/lib/supabase'

export type BagSummary = Tables<'bag_summary'>
export type BagFields = Omit<TablesInsert<'bags'>, 'id' | 'user_id' | 'photo_path' | 'search' | 'search_text'>

export const bagKeys = {
  all: ['bags'] as const,
  list: () => [...bagKeys.all, 'list'] as const,
  detail: (id: string) => [...bagKeys.all, 'detail', id] as const,
  tags: () => [...bagKeys.all, 'tags'] as const,
}

export function useBags() {
  return useQuery({
    queryKey: bagKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bag_summary')
        .select('*')
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

/** Every flavor tag used so far, most frequent first (suggestions for the tag input). */
export function useFlavorTagSuggestions() {
  return useQuery({
    queryKey: bagKeys.tags(),
    queryFn: async () => {
      const { data, error } = await supabase.from('bags').select('flavor_tags')
      if (error) throw error
      return rankByFrequency(data.flatMap((row) => row.flavor_tags))
    },
  })
}

function rankByFrequency(values: string[]) {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}

export function useCreateBag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ fields, photo }: { fields: BagFields; photo: ProcessedPhoto }) => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')

      // The id is generated here so the photo can be uploaded to its final path first.
      const id = crypto.randomUUID()
      const path = await uploadPhoto(newPhotoPath(auth.user.id, 'bags', id), photo)
      const { error } = await supabase.from('bags').insert({ ...fields, id, photo_path: path })
      if (error) {
        await deletePhoto(path).catch(() => {})
        throw error
      }
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bagKeys.all }),
  })
}

export function useUpdateBag(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      fields,
      photo,
      currentPhotoPath,
    }: {
      fields: TablesUpdate<'bags'>
      photo: ProcessedPhoto | null
      currentPhotoPath: string
    }) => {
      if (!photo) {
        const { error } = await supabase.from('bags').update(fields).eq('id', id)
        if (error) throw error
        return
      }
      // New photo: upload to a fresh path, point the row at it, then drop the old files.
      const userId = currentPhotoPath.split('/')[0]
      const path = await uploadPhoto(newPhotoPath(userId, 'bags', id), photo)
      const { error } = await supabase.from('bags').update({ ...fields, photo_path: path }).eq('id', id)
      if (error) {
        await deletePhoto(path).catch(() => {})
        throw error
      }
      await deletePhoto(currentPhotoPath).catch(() => {})
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
