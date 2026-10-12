// When to ask "¿Ya terminaste esta bolsa?". Tune these once real bag lifetimes are known.
export const FINISH_PROMPT = {
  /** Ask once a bag has been open this long… */
  openDays: 14,
  /** …or once this long has passed since its last cup (or since opening, with no cups). */
  idleDays: 7,
  /** "Todavía no" postpones the question this long. */
  snoozeDays: 7,
} as const

const DAY_MS = 24 * 60 * 60 * 1000

type BagForPrompt = {
  opened_at: string | null
  finished_at: string | null
  finish_prompt_snoozed_until: string | null
  last_cup_at: string | null
}

export function shouldAskIfFinished(bag: BagForPrompt, now: Date = new Date()): boolean {
  if (bag.finished_at || !bag.opened_at) return false
  if (bag.finish_prompt_snoozed_until && now < new Date(bag.finish_prompt_snoozed_until)) return false

  const openedAt = new Date(bag.opened_at).getTime()
  const lastActivity = bag.last_cup_at ? new Date(bag.last_cup_at).getTime() : openedAt
  const t = now.getTime()
  return t - openedAt >= FINISH_PROMPT.openDays * DAY_MS || t - lastActivity >= FINISH_PROMPT.idleDays * DAY_MS
}

export function snoozedUntil(now: Date = new Date()): Date {
  return new Date(now.getTime() + FINISH_PROMPT.snoozeDays * DAY_MS)
}
