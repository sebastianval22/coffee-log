import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'
import { useUpdateVisit, useVisit } from './api'
import { VisitForm } from './VisitForm'
import { visitToValues } from './visitFormValues'

export function EditVisitPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: visit, isPending } = useVisit(id)
  const updateVisit = useUpdateVisit(id)

  if (isPending) return <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-muted" />
  if (!visit) return <p className="text-muted-foreground">No encontramos esta visita.</p>

  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">Editar visita</h1>
      <VisitForm
        defaultValues={visitToValues(visit)}
        storedPhotoPath={visit.photo_path!}
        submitLabel="Guardar cambios"
        onSubmit={async (fields, photo) => {
          try {
            await updateVisit.mutateAsync({ fields, photo, currentPhotoPath: visit.photo_path! })
            toast.success('Cambios guardados')
            navigate(`/visits/${id}`, { replace: true })
          } catch (e) {
            toast.error(errorMessage(e))
          }
        }}
      />
    </section>
  )
}
