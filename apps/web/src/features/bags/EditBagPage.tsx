import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'
import { useBag, useUpdateBag } from './api'
import { BagForm } from './BagForm'
import { bagToValues } from './bagFormValues'

export function EditBagPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: bag, isPending } = useBag(id)
  const updateBag = useUpdateBag(id)

  if (isPending) return <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-muted" />
  if (!bag) return <p className="text-muted-foreground">No encontramos esta bolsa.</p>

  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar bolsa</h1>
      <BagForm
        defaultValues={bagToValues(bag)}
        storedPhotoPath={bag.photo_path!}
        submitLabel="Guardar cambios"
        onSubmit={async (fields, photo) => {
          try {
            await updateBag.mutateAsync({ fields, photo, currentPhotoPath: bag.photo_path! })
            toast.success('Cambios guardados')
            navigate(`/bags/${id}`, { replace: true })
          } catch (e) {
            toast.error(errorMessage(e))
          }
        }}
      />
    </section>
  )
}
