import type { ComponentProps, ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

/** A styled native <select> (the iOS system picker beats a custom popover on the phone). */
export function NativeSelect({
  options,
  className,
  ...props
}: ComponentProps<'select'> & { options: Record<string, string> }) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs md:text-sm',
        className,
      )}
      {...props}
    >
      <option value="">—</option>
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
