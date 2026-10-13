import { describe, expect, it } from 'vitest'
import { activeFilterCount, dateRange, parseFilters } from './filters'

describe('parseFilters', () => {
  it('fills defaults and reads values', () => {
    const f = parseFilters(new URLSearchParams('q=etiopia&process=washed&min=4'))
    expect(f).toEqual({ q: 'etiopia', process: 'washed', roast: '', min: '4', from: '', to: '', sort: 'date' })
  })

  it('only accepts known sort values', () => {
    expect(parseFilters(new URLSearchParams('sort=rating')).sort).toBe('rating')
    expect(parseFilters(new URLSearchParams('sort=bogus')).sort).toBe('date')
  })
})

describe('activeFilterCount', () => {
  it('counts filters but not the search text or sorting', () => {
    const f = parseFilters(new URLSearchParams('q=x&sort=rating&process=natural&from=2026-10-01'))
    expect(activeFilterCount(f)).toBe(2)
  })
})

describe('dateRange', () => {
  it('makes the end day inclusive (start of the next local day, exclusive)', () => {
    const { start, end } = dateRange({ from: '2026-10-01', to: '2026-10-01' })
    expect(new Date(end!).getTime() - new Date(start!).getTime()).toBe(24 * 60 * 60 * 1000)
    expect(new Date(start!).getHours()).toBe(0)
  })

  it('leaves open ends empty', () => {
    expect(dateRange({ from: '', to: '' })).toEqual({ start: null, end: null })
  })
})
