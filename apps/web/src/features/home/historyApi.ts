import { useInfiniteQuery } from '@tanstack/react-query'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type HistoryEvent = Tables<'history_feed'>
export type HistoryKind = 'bag_opened' | 'bag_finished' | 'tasting' | 'cafe_visit'

const PAGE_SIZE = 20

/** Home timeline (openings, finishes, tastings, café visits), newest first, 20 at a time. */
export function useHistory() {
  return useInfiniteQuery({
    queryKey: ['history'],
    // Bags, cups and visits change from other screens; refetch whenever Home mounts.
    staleTime: 0,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from('history_feed')
        .select('*')
        .order('occurred_at', { ascending: false })
        // Tie-breakers keep the order stable across pages when timestamps match.
        .order('kind')
        .order('cup_id', { nullsFirst: true })
        .order('bag_id', { nullsFirst: true })
        .order('visit_id', { nullsFirst: true })
        .range(pageParam, pageParam + PAGE_SIZE - 1)
      if (error) throw error
      return data
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE,
  })
}

export function eventKey(e: HistoryEvent) {
  return `${e.kind}:${e.cup_id ?? e.visit_id ?? e.bag_id}`
}

export function eventLink(e: HistoryEvent) {
  return e.kind === 'cafe_visit' ? `/visits/${e.visit_id}` : `/bags/${e.bag_id}`
}
