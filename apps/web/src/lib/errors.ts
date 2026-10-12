/** A short Spanish message for a failed request, keeping the original text for diagnosis. */
export function errorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error)
  if (/fetch|network/i.test(detail)) return 'Sin conexión. Revisa tu internet e intenta de nuevo.'
  return `No se pudo guardar (${detail}).`
}
