import { Star, StarHalf, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number | null
  onChange: (value: number | null) => void
  className?: string
}

/**
 * 0–5 stars in 0.5 steps. Tapping the left half of a star gives x.5, the right half x.0.
 * Tapping the current value again clears it.
 */
export function RatingInput({ value, onChange, className }: Props) {
  function pick(next: number) {
    onChange(next === value ? null : next)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="relative size-9">
            <StarIcon fill={fillFor(value, star)} />
            <button
              type="button"
              aria-label={`${star - 0.5} estrellas`}
              className="absolute inset-y-0 left-0 w-1/2"
              onClick={() => pick(star - 0.5)}
            />
            <button
              type="button"
              aria-label={`${star} estrellas`}
              className="absolute inset-y-0 right-0 w-1/2"
              onClick={() => pick(star)}
            />
          </span>
        ))}
      </div>
      {value !== null && (
        <>
          <span className="w-8 text-sm font-medium tabular-nums">{value.toFixed(1)}</span>
          <button
            type="button"
            aria-label="Quitar rating"
            className="text-muted-foreground"
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </button>
        </>
      )}
    </div>
  )
}

/** Read-only stars. */
export function RatingStars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="size-4">
          <StarIcon fill={fillFor(value, star)} />
        </span>
      ))}
    </span>
  )
}

function fillFor(value: number | null, star: number): 'full' | 'half' | 'empty' {
  if (value === null || value <= star - 1) return 'empty'
  return value >= star ? 'full' : 'half'
}

function StarIcon({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  return (
    <span className="relative block size-full p-0.5">
      <Star className="size-full text-crema/40" strokeWidth={1.5} />
      {fill !== 'empty' && (
        <span className="absolute inset-0 p-0.5">
          {fill === 'full' ? (
            <Star className="size-full fill-crema text-crema" strokeWidth={1.5} />
          ) : (
            <StarHalf className="size-full fill-crema text-crema" strokeWidth={1.5} />
          )}
        </span>
      )}
    </span>
  )
}
