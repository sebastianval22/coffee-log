import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { normalizeName } from '@/lib/text'
import { cn } from '@/lib/utils'

type Props = {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  /** Previously used values, offered as quick picks and filtered while typing. */
  suggestions?: string[]
  placeholder?: string
  className?: string
}

const MAX_SUGGESTIONS = 8

/** Free-text chips. Enter or comma adds; duplicates are ignored regardless of case/accents. */
export function TagInput({ id, value, onChange, suggestions = [], placeholder, className }: Props) {
  const [draft, setDraft] = useState('')
  const chosen = new Set(value.map(normalizeName))
  const query = normalizeName(draft)
  const matches = suggestions
    .filter((s) => !chosen.has(normalizeName(s)) && normalizeName(s).includes(query))
    .slice(0, MAX_SUGGESTIONS)

  function add(raw: string) {
    const tag = raw.trim().replace(/,$/, '').trim()
    setDraft('')
    if (tag && !chosen.has(normalizeName(tag))) onChange([...value, tag])
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 text-sm">
              {tag}
              <button
                type="button"
                aria-label={`Quitar ${tag}`}
                className="rounded-full p-0.5 hover:bg-background"
                onClick={() => onChange(value.filter((t) => t !== tag))}
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        enterKeyHint="enter"
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
      />
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              // mousedown fires before the input's blur, so the draft isn't added first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="rounded-full border border-dashed px-2.5 py-1 text-sm text-muted-foreground hover:border-solid hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
