import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { normalizeName } from '@/lib/text'
import { cn } from '@/lib/utils'

export type ComboboxItem = { id: string; label: string; detail?: string | null }

type Props = {
  id?: string
  items: ComboboxItem[]
  value: string | null
  onChange: (id: string | null) => void
  /** Creates a new item from the typed text and resolves to its id. */
  onCreate: (name: string) => Promise<string>
  placeholder: string
  searchPlaceholder: string
  className?: string
}

/** Pick an existing item or create one from the search text. */
export function CreatableCombobox({
  id,
  items,
  value,
  onChange,
  onCreate,
  placeholder,
  searchPlaceholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const selected = items.find((item) => item.id === value)
  const typed = search.trim()
  const exactMatch = items.some((item) => normalizeName(item.label) === normalizeName(typed))

  async function create() {
    setCreating(true)
    try {
      onChange(await onCreate(typed))
      setOpen(false)
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 flex-1 justify-between font-normal"
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command
            filter={(itemValue, query) =>
              normalizeName(itemValue).includes(normalizeName(query)) ? 1 : 0
            }
          >
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList>
              {!typed && <CommandEmpty>Escribe para buscar o crear.</CommandEmpty>}
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.detail ?? ''}`}
                    onSelect={() => {
                      onChange(item.id)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check className={cn(item.id === value ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{item.label}</span>
                    {item.detail && <span className="ml-auto text-xs text-muted-foreground">{item.detail}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
              {typed && !exactMatch && (
                // Its own force-mounted group: cmdk hides a group whose items all fail the filter.
                <CommandGroup forceMount>
                  <CommandItem value={`__create__ ${typed}`} onSelect={create} disabled={creating} forceMount>
                    {creating ? <Loader2 className="animate-spin" /> : <Plus />}
                    Crear “{typed}”
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button type="button" variant="ghost" size="icon" aria-label="Quitar" onClick={() => onChange(null)}>
          <X />
        </Button>
      )}
    </div>
  )
}
