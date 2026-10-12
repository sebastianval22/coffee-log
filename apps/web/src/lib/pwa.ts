/// <reference types="vite-plugin-pwa/vanillajs" />
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

const HOURLY = 60 * 60 * 1000

/**
 * Registers the service worker and offers new versions with a toast instead of reloading on
 * its own (an automatic reload could wipe a half-filled form). An installed iOS PWA is rarely
 * cold-started, so updates are also checked whenever the app comes back to the foreground.
 */
export function registerServiceWorker() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast('Hay una versión nueva de la app', {
        duration: Infinity,
        action: { label: 'Actualizar', onClick: () => updateSW(true) },
      })
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) void registration.update()
      }
      document.addEventListener('visibilitychange', check)
      setInterval(check, HOURLY)
    },
  })
}
