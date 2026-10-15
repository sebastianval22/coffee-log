import { Camera, ImageUp, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { processPhoto, type ProcessedPhoto } from '@/lib/image'
import { cn } from '@/lib/utils'
import { StoredPhoto } from './StoredPhoto'

type Props = {
  /** A newly picked (processed, not yet uploaded) photo. */
  value: ProcessedPhoto | null
  onChange: (photo: ProcessedPhoto) => void
  /** Path of the photo already saved, shown until a new one is picked (edit forms). */
  storedPath?: string | null
  error?: string
  className?: string
}

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

export function PhotoPicker({ value, onChange, storedPath, error, className }: Props) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)
  const preview = useObjectUrl(value?.full)
  const hasPhoto = Boolean(preview || storedPath)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow picking the same file again
    if (!file) return
    setProcessing(true)
    setProcessError(null)
    try {
      onChange(await processPhoto(file))
    } catch (e) {
      setProcessError(e instanceof Error ? e.message : 'No se pudo procesar la imagen.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'relative mx-auto aspect-[4/5] max-h-[45dvh] w-full overflow-hidden rounded-2xl border bg-muted',
          !hasPhoto && 'border-dashed',
          (error || processError) && 'border-destructive',
        )}
      >
        {preview ? (
          <img src={preview} alt="Foto seleccionada" className="size-full object-cover" />
        ) : storedPath ? (
          <StoredPhoto path={storedPath} variant="full" alt="Foto guardada" className="size-full" />
        ) : (
          <button
            type="button"
            onClick={() => (isTouchDevice() ? cameraInput : fileInput).current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <Camera className="size-10" />
            <span className="font-medium">Agregar foto</span>
          </button>
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-8 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={hasPhoto ? 'outline' : 'default'}
          className="flex-1 pointer-fine:hidden"
          onClick={() => cameraInput.current?.click()}
          disabled={processing}
        >
          <Camera /> {hasPhoto ? 'Tomar otra' : 'Tomar foto'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInput.current?.click()}
          disabled={processing}
        >
          <ImageUp /> {hasPhoto ? 'Cambiar foto' : 'Elegir foto'}
        </Button>
      </div>

      {(error || processError) && <p className="text-sm text-destructive">{processError ?? error}</p>}

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}

function useObjectUrl(blob: Blob | undefined) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}
