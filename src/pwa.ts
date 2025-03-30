import { registerSW } from 'virtual:pwa-register'

const intervalMS = 60 * 60 * 1000

registerSW({
  onRegisteredSW(swUrl: string, r?: ServiceWorkerRegistration) {
    if (!r) return
    setInterval(async () => {
      if (r.installing || !navigator || ('connection' in navigator && !navigator.onLine)) return
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          cache: 'no-store',
          'cache-control': 'no-cache',
        },
      })
      if (resp.status !== 200) return
      await r.update()
    }, intervalMS)
  },
})
