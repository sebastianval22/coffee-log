import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Every flavor tag used so far (bags, tastings, café visits), most frequent first. */
export function useFlavorTagSuggestions() {
  return useQuery({
    queryKey: ['flavor-tags'],
    // Refetched whenever a form mounts, so tags added a moment ago are suggested too.
    staleTime: 0,
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('bags').select('flavor_tags'),
        supabase.from('cups').select('flavor_tags').eq('is_tasting', true),
        supabase.from('cafe_visits').select('flavor_tags'),
      ])
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
      return rankByFrequency(results.flatMap((r) => r.data ?? []).flatMap((row) => row.flavor_tags))
    },
  })
}

function rankByFrequency(values: string[]) {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}
