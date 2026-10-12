import { useQuery } from '@tanstack/react-query'
import type { ProcessedPhoto } from './image'
import { supabase } from './supabase'

// Storage layout (private bucket, RLS by first folder = user id):
//   photos/{userId}/{bags|visits}/{entityId}/full.jpg
//   photos/{userId}/{bags|visits}/{entityId}/thumb.jpg
// The database stores the full.jpg path; the thumbnail sits next to it.

const BUCKET = 'photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

export type PhotoKind = 'bags' | 'visits'
export type PhotoVariant = 'full' | 'thumb'

export function photoPath(userId: string, kind: PhotoKind, entityId: string) {
  return `${userId}/${kind}/${entityId}/full.jpg`
}

export function variantPath(photoPath: string, variant: PhotoVariant) {
  return variant === 'full' ? photoPath : photoPath.replace(/full\.jpg$/, 'thumb.jpg')
}

/** Uploads both sizes (overwriting any previous photo) and returns the path to store in the row. */
export async function uploadPhoto(path: string, photo: ProcessedPhoto): Promise<string> {
  const bucket = supabase.storage.from(BUCKET)
  const options = { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' }
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
