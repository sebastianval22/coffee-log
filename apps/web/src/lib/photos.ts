import { useQuery } from '@tanstack/react-query'
import type { ProcessedPhoto } from './image'
import { supabase } from './supabase'

// Storage layout (private bucket, RLS by first folder = user id):
//   photos/{userId}/{bags|visits}/{entityId}/{photoId}/full.jpg
//   photos/{userId}/{bags|visits}/{entityId}/{photoId}/thumb.jpg
// The database stores the full.jpg path; the thumbnail sits next to it. Every new photo gets a
// fresh photoId, so a replaced photo never collides with cached copies of the old one.

const BUCKET = 'photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

export type PhotoKind = 'bags' | 'visits'
export type PhotoVariant = 'full' | 'thumb'

/** A new, unique path for a photo of this entity. */
export function newPhotoPath(userId: string, kind: PhotoKind, entityId: string) {
  return `${userId}/${kind}/${entityId}/${crypto.randomUUID()}/full.jpg`
}

export function variantPath(photoPath: string, variant: PhotoVariant) {
  return variant === 'full' ? photoPath : photoPath.replace(/full\.jpg$/, 'thumb.jpg')
}

/** Uploads both sizes and returns the path to store in the row. */
export async function uploadPhoto(path: string, photo: ProcessedPhoto): Promise<string> {
  const bucket = supabase.storage.from(BUCKET)
  const options = { contentType: 'image/jpeg', cacheControl: '31536000' }
  const results = await Promise.all([
    bucket.upload(path, photo.full, options),
    bucket.upload(variantPath(path, 'thumb'), photo.thumb, options),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
  return path
}

export async function deletePhoto(path: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path, variantPath(path, 'thumb')])
  if (error) throw error
}

/**
 * Saves a new row that owns a photo. The id is generated here so the photo can go to its
 * final path before the insert; if the insert fails, the uploaded files are removed.
 */
export async function createWithPhoto(
  kind: PhotoKind,
  photo: ProcessedPhoto,
  insert: (id: string, photoPath: string) => PromiseLike<{ error: unknown }>,
): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')

  const id = crypto.randomUUID()
  const path = await uploadPhoto(newPhotoPath(auth.user.id, kind, id), photo)
  const { error } = await insert(id, path)
  if (error) {
    await deletePhoto(path).catch(() => {})
    throw error
  }
  return id
}

/**
 * Updates a row that owns a photo. With a new photo: upload to a fresh path, point the row at
 * it, then remove the old files (a fresh path can't be served from a stale cache).
 */
export async function updateWithPhoto(
  kind: PhotoKind,
  entityId: string,
  currentPath: string,
  photo: ProcessedPhoto | null,
  update: (newPhotoPath: string | null) => PromiseLike<{ error: unknown }>,
): Promise<void> {
  if (!photo) {
    const { error } = await update(null)
    if (error) throw error
    return
  }
  const userId = currentPath.split('/')[0]
  const path = await uploadPhoto(newPhotoPath(userId, kind, entityId), photo)
  const { error } = await update(path)
  if (error) {
    await deletePhoto(path).catch(() => {})
    throw error
  }
  await deletePhoto(currentPath).catch(() => {})
}

export function signedUrlQueryKey(path: string, variant: PhotoVariant) {
  return ['photo-url', variantPath(path, variant)] as const
}

/** Signed URL for a stored photo, cached a bit less than its lifetime. */
export function useSignedPhotoUrl(path: string | null | undefined, variant: PhotoVariant) {
  return useQuery({
    queryKey: signedUrlQueryKey(path ?? '', variant),
    enabled: Boolean(path),
    staleTime: (SIGNED_URL_TTL_SECONDS - 300) * 1000,
    gcTime: (SIGNED_URL_TTL_SECONDS - 300) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(variantPath(path!, variant), SIGNED_URL_TTL_SECONDS)
      if (error) throw error
      return data.signedUrl
    },
  })
}
