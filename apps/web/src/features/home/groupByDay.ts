export type DayGroup<T> = { key: string; label: string; items: T[] }

const weekdayDate = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const fullDate = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** yyyy-mm-dd of a moment in the device's time zone. */
function localDayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "Hoy", "Ayer", "sábado 10 de octubre" (adds the year when it isn't this year). */
export function dayLabel(date: Date, now: Date = new Date()) {
  const key = localDayKey(date)
  if (key === localDayKey(now)) return 'Hoy'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (key === localDayKey(yesterday)) return 'Ayer'
  const label = (date.getFullYear() === now.getFullYear() ? weekdayDate : fullDate).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Groups items (already sorted newest first) by local calendar day, keeping their order. */
export function groupByDay<T>(items: T[], dateOf: (item: T) => Date, now: Date = new Date()): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  for (const item of items) {
    const date = dateOf(item)
    const key = localDayKey(date)
    const last = groups.at(-1)
    if (last?.key === key) last.items.push(item)
    else groups.push({ key, label: dayLabel(date, now), items: [item] })
  }
  return groups
}
