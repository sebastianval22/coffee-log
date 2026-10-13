import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

/** Search + filters shared by "Cafés" and "Cafeterías". Every field lives in the URL. */
export type Filters = {
  q: string
  process: string
  roast: string
  /** Minimum rating, e.g. "4" or "3.5"; empty for any. */
  min: string
  /** yyyy-mm-dd, inclusive, in the device's time zone. */
  from: string
  to: string
  sort: 'date' | 'rating'
}

const DEFAULTS: Filters = { q: '', process: '', roast: '', min: '', from: '', to: '', sort: 'date' }
const KEYS = Object.keys(DEFAULTS) as (keyof Filters)[]

export function parseFilters(params: URLSearchParams): Filters {
  const read = (key: keyof Filters) => params.get(key) ?? DEFAULTS[key]
  return {
    q: read('q'),
    process: read('process'),
    roast: read('roast'),
    min: read('min'),
    from: read('from'),
    to: read('to'),
    sort: read('sort') === 'rating' ? 'rating' : 'date',
  }
}

/** How many filters (besides the text search and sorting) are active. */
export function activeFilterCount(f: Filters) {
  return [f.process, f.roast, f.min, f.from, f.to].filter(Boolean).length
}

/** Inclusive local-day range → [start, end) ISO timestamps for a timestamptz column. */
export function dateRange(f: Pick<Filters, 'from' | 'to'>) {
  const start = f.from ? new Date(`${f.from}T00:00`).toISOString() : null
  let end: string | null = null
  if (f.to) {
    const next = new Date(`${f.to}T00:00`)
    next.setDate(next.getDate() + 1)
    end = next.toISOString()
  }
  return { start, end }
}

/** Filters from the URL plus a setter that merges a patch and drops default values. */
export function useUrlFilters(extraKeys: string[] = []) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const update = useCallback(
    (patch: Partial<Filters> & Record<string, string | undefined>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            const isDefault = KEYS.includes(key as keyof Filters) && DEFAULTS[key as keyof Filters] === value
            if (!value || isDefault) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const clear = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams()
        // Keep the text search and view switches (tabs, grouping); drop the filters.
        for (const key of ['q', 'sort', ...extraKeys]) {
          const value = prev.get(key)
          if (value) next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }, [setParams, extraKeys])

  return { filters, params, update, clear }
}
