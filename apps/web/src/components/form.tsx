import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  allowEmpty = true,
  className,
  ...props
}: ComponentProps<'select'> & { options: Record<string, string>; allowEmpty?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-11 w-full min-w-0 appearance-none truncate rounded-md border border-input bg-transparent pr-8 pl-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:h-9 md:text-sm',
          className,
        )}
        {...props}
      >
        {allowEmpty && <option value="">—</option>}
        {Object.entries(options).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50" />
    </div>
  )
}

/** A collapsible group of optional fields. */
export function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-xl border bg-card">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 font-medium">
        {title}
        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
