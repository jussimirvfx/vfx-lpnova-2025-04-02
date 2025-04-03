/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = "vfx-cache-v1"
const OFFLINE_URL = "/offline"

// Estratégia de cache por tipo de recurso - priorizando fontes para o LCP
const CACHE_STRATEGIES = {
  images: "cache-first",
  fonts: "cache-first", // Fontes devem ser carregadas o mais rápido possível
  scripts: "stale-while-revalidate",
  styles: "stale-while-revalidate",
  documents: "network-first",
} as const

// Recursos críticos para o LCP baseado em texto
const LCP_RESOURCES = [
  // Fontes que afetam o título principal
  "https://fonts.googleapis.com/css2",
  "https://fonts.gstatic.com",
]

// Assets que devem ser cacheados imediatamente - priorizando fontes
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Fontes
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
]

// Instalação do Service Worker com precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      }),
      self.skipWaiting(),
    ]),
  )
})

// Limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
        )
      }),
      self.clients.claim(),
    ]),
  )
})

// Função para determinar a estratégia de cache baseada no tipo de recurso
function getResourceType(request: Request) {
  const url = new URL(request.url)

  // Priorizar recursos críticos para LCP
  if (LCP_RESOURCES.some((resource) => url.href.includes(resource))) {
    return "fonts" // Tratar recursos do Google Fonts como fontes
  }

  if (request.destination === "image") return "images"
  if (request.destination === "font") return "fonts"
  if (request.destination === "script") return "scripts"
  if (request.destination === "style") return "styles"
  if (request.mode === "navigate") return "documents"

  return "documents"
}

// Implementação das estratégias de cache
async function handleCacheFirst(request: Request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) return cachedResponse

  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    // Verificar se é um recurso de fonte, para tentar aplicar uma fonte fallback
    if (request.destination === "font") {
      console.log("Font request failed, applying fallback system font")
    }
    return new Response("Cache first strategy failed")
  }
}

async function handleStaleWhileRevalidate(request: Request) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((response) => {
    const cache = caches.open(CACHE_NAME)
    cache.then((cache) => cache.put(request, response.clone()))
    return response
  })

  return cachedResponse || fetchPromise
}

async function handleNetworkFirst(request: Request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse
    return caches.match(OFFLINE_URL)
  }
}

// Interceptação de requisições com estratégias específicas
self.addEventListener("fetch", (event) => {
  // Não interceptar requisições para analytics ou rastreamento
  if (
    event.request.url.includes("analytics") ||
    event.request.url.includes("gtm") ||
    event.request.url.includes("google-analytics")
  ) {
    return
  }

  // Verificar se é uma requisição para a origem ou para recursos de fontes do Google
  const shouldHandle =
    event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes("fonts.googleapis.com") ||
    event.request.url.includes("fonts.gstatic.com")

  if (!shouldHandle) return

  const resourceType = getResourceType(event.request)
  const strategy = CACHE_STRATEGIES[resourceType]

  switch (strategy) {
    case "cache-first":
      event.respondWith(handleCacheFirst(event.request))
      break
    case "stale-while-revalidate":
      event.respondWith(handleStaleWhileRevalidate(event.request))
      break
    case "network-first":
      event.respondWith(handleNetworkFirst(event.request))
      break
    default:
      event.respondWith(handleNetworkFirst(event.request))
  }
})

// Sincronização em background
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms())
  }
})

// Notificações push
self.addEventListener("push", (event) => {
  const options = {
    body: event.data?.text() ?? "Notificação da VFX Agência",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
  }

  event.waitUntil(self.registration.showNotification("VFX Agência", options))
})

async function syncForms() {
  // Implementar sincronização de formulários quando offline
}

export {}

