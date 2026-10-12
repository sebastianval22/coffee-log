import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'
import { useCreateVisit } from './api'
import { VisitForm } from './VisitForm'
import { emptyVisitValues } from './visitFormValues'

export function NewVisitPage() {
  const navigate = useNavigate()
  const createVisit = useCreateVisit()

  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Estoy en una cafetería</h1>
      <VisitForm
        defaultValues={emptyVisitValues()}
        submitLabel="Guardar visita"
        onSubmit={async (fields, photo) => {
          try {
            const id = await createVisit.mutateAsync({ fields, photo: photo! })
            toast.success('Visita guardada')
            navigate(`/visits/${id}`, { replace: true })
          } catch (e) {
            toast.error(errorMessage(e))
          }
        }}
      />
    </section>
  )
}
