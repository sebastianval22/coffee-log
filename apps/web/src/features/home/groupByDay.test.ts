import { describe, expect, it } from 'vitest'
import { dayLabel, groupByDay } from './groupByDay'

// Local-time constructors, so the tests hold in any time zone.
const NOW = new Date(2026, 9, 12, 10, 0) // Mon 12 Oct 2026, 10:00

describe('dayLabel', () => {
  it('names today and yesterday', () => {
    expect(dayLabel(new Date(2026, 9, 12, 0, 5), NOW)).toBe('Hoy')
    expect(dayLabel(new Date(2026, 9, 11, 23, 59), NOW)).toBe('Ayer')
  })

  it('uses weekday and date for older days, capitalized', () => {
    expect(dayLabel(new Date(2026, 9, 10, 9, 0), NOW)).toBe('Sábado, 10 de octubre')
  })

  it('adds the year outside the current year', () => {
    expect(dayLabel(new Date(2025, 11, 31, 9, 0), NOW)).toMatch(/2025/)
  })
})

describe('groupByDay', () => {
  it('groups consecutive items of the same local day, keeping order', () => {
    const items = [
      new Date(2026, 9, 12, 9, 0),
      new Date(2026, 9, 12, 7, 0),
      new Date(2026, 9, 11, 22, 0),
      new Date(2026, 9, 10, 8, 0),
    ]
    const groups = groupByDay(items, (d) => d, NOW)
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['Hoy', 2],
      ['Ayer', 1],
      ['Sábado, 10 de octubre', 1],
    ])
  })

  it('continues a day split across pages', () => {
    const page1 = groupByDay([new Date(2026, 9, 11, 9, 0)], (d) => d, NOW)
    const both = groupByDay([new Date(2026, 9, 11, 9, 0), new Date(2026, 9, 11, 8, 0)], (d) => d, NOW)
    expect(page1).toHaveLength(1)
    expect(both).toHaveLength(1)
  })
})
