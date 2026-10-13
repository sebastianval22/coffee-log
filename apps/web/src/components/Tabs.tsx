import { cn } from '@/lib/utils'

/** Small segmented control. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: [T, string][]
}) {
  return (
    <div className="flex rounded-lg bg-secondary p-0.5" role="tablist">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition',
            value === key && 'bg-background text-foreground shadow-sm',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
