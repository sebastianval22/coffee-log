import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Field, NativeSelect } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROCESS_LABELS, ROAST_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { activeFilterCount, type Filters } from './filters'

const MIN_RATINGS = { '3': '3 o más', '3.5': '3,5 o más', '4': '4 o más', '4.5': '4,5 o más', '5': 'Solo 5' }
const SEARCH_DEBOUNCE_MS = 300

type Props = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
  placeholder: string
  /** Label for the date range, e.g. "Abierta" or "Visitada". */
  dateLabel: string
  showRoast?: boolean
}

export function FilterBar({ filters, onChange, onClear, placeholder, dateLabel, showRoast = false }: Props) {
  const active = activeFilterCount(filters)
  const [open, setOpen] = useState(active > 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <SearchInput value={filters.q} onChange={(q) => onChange({ q })} placeholder={placeholder} />
        <Button
          type="button"
          variant={open ? 'secondary' : 'outline'}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="shrink-0"
        >
          <SlidersHorizontal />
          <span className="hidden sm:inline">Filtros</span>
          {active > 0 && <Badge className="ml-0.5 h-5 min-w-5 px-1.5">{active}</Badge>}
        </Button>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 md:grid-cols-4">
          <Field label="Proceso" htmlFor="f-process">
            <NativeSelect
              id="f-process"
              options={PROCESS_LABELS}
              value={filters.process}
              onChange={(e) => onChange({ process: e.target.value })}
            />
          </Field>
          {showRoast && (
            <Field label="Tostión" htmlFor="f-roast">
              <NativeSelect
                id="f-roast"
                options={ROAST_LABELS}
                value={filters.roast}
                onChange={(e) => onChange({ roast: e.target.value })}
              />
            </Field>
          )}
          <Field label="Rating" htmlFor="f-min">
            <NativeSelect
              id="f-min"
              options={MIN_RATINGS}
              value={filters.min}
              onChange={(e) => onChange({ min: e.target.value })}
            />
          </Field>
          <Field label="Ordenar por" htmlFor="f-sort">
            <select
              id="f-sort"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs md:text-sm"
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as Filters['sort'] })}
            >
              <option value="date">Más recientes</option>
              <option value="rating">Mejor rating</option>
            </select>
          </Field>
          <Field label={`${dateLabel} desde`} htmlFor="f-from">
            <Input
              id="f-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => onChange({ from: e.target.value })}
            />
          </Field>
          <Field label="hasta" htmlFor="f-to">
            <Input
              id="f-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </Field>
          {active > 0 && (
            <Button type="button" variant="ghost" className="col-span-2 justify-self-start md:col-span-4" onClick={onClear}>
              <X /> Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Text search that updates the URL after a short pause in typing. */
function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState(value)

  // Follow outside changes (back/forward navigation, "Limpiar").
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft.trim() ? draft : ''), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className={cn('pl-9', draft && 'pr-9')}
        enterKeyHint="search"
      />
      {draft && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setDraft('')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
