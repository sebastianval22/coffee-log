import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'
import { useCreateBag } from './api'
import { BagForm } from './BagForm'
import { emptyBagValues } from './bagFormValues'

export function NewBagPage() {
  const navigate = useNavigate()
  const createBag = useCreateBag()

  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Abrí una bolsa</h1>
      <BagForm
        defaultValues={emptyBagValues()}
        submitLabel="Guardar bolsa"
        onSubmit={async (fields, photo) => {
          try {
            const id = await createBag.mutateAsync({ fields, photo: photo! })
            toast.success('Bolsa guardada')
            navigate(`/bags/${id}`, { replace: true })
          } catch (e) {
            toast.error(errorMessage(e))
          }
        }}
      />
    </section>
  )
}
