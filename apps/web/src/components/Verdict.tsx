import type { ReactNode } from 'react'
import { RatingStars } from '@/components/RatingInput'
import { Badge } from '@/components/ui/badge'

type Props = {
  rating: number | null
  tags: string[] | null
  notes: string | null
  /** Extra line under the notes (e.g. "La compraría de nuevo"). */
  footer?: ReactNode
}

/** Rating, flavor tags and notes; renders nothing when all are empty. */
export function Verdict({ rating, tags, notes, footer }: Props) {
  if (rating === null && !tags?.length && !notes && !footer) return null

  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      {rating !== null && (
        <div className="flex items-center gap-2">
          <RatingStars value={rating} />
          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
      )}
      {!!tags?.length && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {notes && <p className="text-sm whitespace-pre-line">{notes}</p>}
      {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
    </section>
  )
}
