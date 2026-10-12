import { describe, expect, it } from 'vitest'
import { shouldAskIfFinished, snoozedUntil } from './finishPrompt'

const NOW = new Date('2026-10-20T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

const bag = (overrides: Partial<Parameters<typeof shouldAskIfFinished>[0]> = {}) => ({
  opened_at: daysAgo(3),
  finished_at: null,
  finish_prompt_snoozed_until: null,
  last_cup_at: daysAgo(1),
  ...overrides,
})

describe('shouldAskIfFinished', () => {
  it('stays quiet for a recently opened bag in use', () => {
    expect(shouldAskIfFinished(bag(), NOW)).toBe(false)
  })

  it('asks once the bag has been open 14 days, even if still in use', () => {
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(14), last_cup_at: daysAgo(0) }), NOW)).toBe(true)
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(13), last_cup_at: daysAgo(0) }), NOW)).toBe(false)
  })

  it('asks after 7 days without a cup', () => {
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(10), last_cup_at: daysAgo(7) }), NOW)).toBe(true)
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(10), last_cup_at: daysAgo(6) }), NOW)).toBe(false)
  })

  it('counts idle time from opening when there are no cups', () => {
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(7), last_cup_at: null }), NOW)).toBe(true)
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(6), last_cup_at: null }), NOW)).toBe(false)
  })

  it('respects "Todavía no" until the snooze ends', () => {
    const stale = { opened_at: daysAgo(20), last_cup_at: daysAgo(10) }
    expect(shouldAskIfFinished(bag({ ...stale, finish_prompt_snoozed_until: daysAgo(-1) }), NOW)).toBe(false)
    expect(shouldAskIfFinished(bag({ ...stale, finish_prompt_snoozed_until: daysAgo(0) }), NOW)).toBe(true)
  })

  it('never asks about a finished bag', () => {
    expect(shouldAskIfFinished(bag({ opened_at: daysAgo(30), finished_at: daysAgo(1) }), NOW)).toBe(false)
  })
})

describe('snoozedUntil', () => {
  it('postpones by 7 days', () => {
    expect(snoozedUntil(NOW).toISOString()).toBe('2026-10-27T12:00:00.000Z')
  })
})
