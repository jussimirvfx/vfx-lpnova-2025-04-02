export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
    const wb = window.workbox

    // Add event listeners to handle PWA lifecycle events
    wb.addEventListener("installed", (event: any) => {
      console.log(`Service Worker installed: ${event.type}`)
    })

    wb.addEventListener("controlling", (event: any) => {
      console.log(`Service Worker controlling: ${event.type}`)
    })

    wb.addEventListener("activated", (event: any) => {
      console.log(`Service Worker activated: ${event.type}`)
    })

    // Register the service worker
    wb.register()
      .then((registration: ServiceWorkerRegistration) => {
        console.log("Service Worker registered with scope:", registration.scope)
      })
      .catch((err: Error) => {
        console.error("Service Worker registration failed:", err)
      })
  }
}

