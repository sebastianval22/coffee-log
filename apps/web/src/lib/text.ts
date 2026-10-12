/** Mirrors public.normalize_name(): lowercase, no accents, collapsed whitespace. */
export function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Trims and returns null for empty strings (optional text columns). */
export function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** `<input type="datetime-local">` value for a timestamp, in the device's time zone. */
export function toLocalInputValue(date: Date | string) {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dateFormat = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(date: Date | string) {
  return dateFormat.format(new Date(date))
}
