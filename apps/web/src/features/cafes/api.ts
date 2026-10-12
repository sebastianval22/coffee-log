import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/text'
import { parseCafeInput } from './parseCafeInput'

export const cafesKey = ['cafes'] as const

export function useCafes() {
  return useQuery({
    queryKey: cafesKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('cafes').select('id, name, city').order('name')
      if (error) throw error
      return data
    },
  })
}

/**
 * Returns the id of the café with this name and city (ignoring case/accents), creating it if
 * needed. Same-named cafés in different cities are different cafés.
 */
export function useFindOrCreateCafe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: string) => {
      const { name, city } = parseCafeInput(input)
      const findExisting = async () => {
        const { data, error } = await supabase.from('cafes').select('id, name, city')
        if (error) throw error
        return data.find(
          (c) =>
            normalizeName(c.name) === normalizeName(name) &&
            normalizeName(c.city ?? '') === normalizeName(city ?? ''),
        )?.id
      }

      const existing = await findExisting()
      if (existing) return existing

      const { data, error } = await supabase.from('cafes').insert({ name, city }).select('id').single()
      if (error?.code === '23505') {
        const id = await findExisting()
        if (id) return id
      }
      if (error) throw error
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cafesKey }),
  })
}
