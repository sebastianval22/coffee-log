import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/text'

export const roastersKey = ['roasters'] as const

export function useRoasters() {
  return useQuery({
    queryKey: roastersKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('roasters').select('id, name, city').order('name')
      if (error) throw error
      return data
    },
  })
}

/** Returns the id of the roaster with this name (ignoring case/accents), creating it if needed. */
export function useFindOrCreateRoaster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const findExisting = async () => {
        const { data, error } = await supabase.from('roasters').select('id, name')
        if (error) throw error
        return data.find((r) => normalizeName(r.name) === normalizeName(name))?.id
      }

      const existing = await findExisting()
      if (existing) return existing

      const { data, error } = await supabase.from('roasters').insert({ name: name.trim() }).select('id').single()
      if (error?.code === '23505') {
        // Created meanwhile (or differs only by accents/case from one we didn't have cached).
        const id = await findExisting()
        if (id) return id
      }
      if (error) throw error
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roastersKey }),
  })
}
