import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { useSignedPhotoUrl, type PhotoVariant } from '@/lib/photos'
import { cn } from '@/lib/utils'

type Props = {
  path: string | null | undefined
  variant: PhotoVariant
  alt: string
  className?: string
}

/** A photo from the private bucket. Shows a placeholder while the signed URL and image load. */
export function StoredPhoto({ path, variant, alt, className }: Props) {
  const { data: url, isError } = useSignedPhotoUrl(path, variant)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {!loaded && !failed && !isError && <div className="absolute inset-0 animate-pulse bg-muted" />}
      {(failed || isError) && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className="size-6" />
        </div>
      )}
      {url && !failed && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('size-full object-cover transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  )
}
