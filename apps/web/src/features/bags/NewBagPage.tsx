import { useState } from 'react'
import { PhotoPicker } from '@/components/PhotoPicker'
import type { ProcessedPhoto } from '@/lib/image'

// The rest of the form arrives with #4.
export function NewBagPage() {
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Abrí una bolsa</h1>
      <PhotoPicker value={photo} onChange={setPhoto} />
    </section>
  )
}
