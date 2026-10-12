import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { bagKeys, type BagSummary } from '@/features/bags/api'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Cup = Tables<'cups'>
export type CupFields = Pick<TablesInsert<'cups'>, 'drunk_at' | 'method' | 'rating' | 'flavor_tags' | 'notes'>

export const cupKeys = {
  all: ['cups'] as const,
  forBag: (bagId: string) => [...cupKeys.all, 'bag', bagId] as const,
}

export function useCups(bagId: string) {
  return useQuery({
    queryKey: cupKeys.forBag(bagId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cups')
        .select('*')
        .eq('bag_id', bagId)
        .order('drunk_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/**
 * "+1": logs a quick cup now. The cup count updates immediately (optimistic) and rolls back
 * if the insert fails. Resolves to the new cup's id so it can be undone.
 */
export function useAddQuickCup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bagId: string) => {
      const { data, error } = await supabase.from('cups').insert({ bag_id: bagId }).select('id').single()
      if (error) throw error
      return data.id
    },
    onMutate: async (bagId) => {
      await queryClient.cancelQueries({ queryKey: bagKeys.all })
      const snapshot = queryClient.getQueriesData<unknown>({ queryKey: bagKeys.all })
      adjustCupCount(queryClient, bagId, +1)
      return { snapshot }
    },
    onError: (_error, _bagId, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: (_id, _error, bagId) => invalidateBag(queryClient, bagId),
  })
}

export function useCreateTasting(bagId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fields: CupFields) => {
      const { error } = await supabase.from('cups').insert({ ...fields, bag_id: bagId })
      if (error) throw error
    },
    onSuccess: () => invalidateBag(queryClient, bagId),
  })
}

export function useUpdateCup(bagId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: TablesUpdate<'cups'> }) => {
      const { error } = await supabase.from('cups').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateBag(queryClient, bagId),
  })
}

export function useDeleteCup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; bagId: string }) => {
      const { error } = await supabase.from('cups').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: ({ bagId }) => adjustCupCount(queryClient, bagId, -1),
    onSettled: (_data, _error, { bagId }) => invalidateBag(queryClient, bagId),
  })
}

function invalidateBag(queryClient: QueryClient, bagId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: bagKeys.all }),
    queryClient.invalidateQueries({ queryKey: cupKeys.forBag(bagId) }),
  ])
}

/** Bumps cup_count on every cached copy of the bag (lists and detail). */
function adjustCupCount(queryClient: QueryClient, bagId: string, delta: number) {
  const bump = (bag: BagSummary) =>
    bag.id === bagId ? { ...bag, cup_count: Math.max(0, (bag.cup_count ?? 0) + delta) } : bag
  queryClient.setQueriesData<BagSummary[] | BagSummary | null>({ queryKey: bagKeys.all }, (data) => {
    if (Array.isArray(data)) return data.map(bump)
    if (data && typeof data === 'object' && 'cup_count' in data) return bump(data)
    return data
  })
}
