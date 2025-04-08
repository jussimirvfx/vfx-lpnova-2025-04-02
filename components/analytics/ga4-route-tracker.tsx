"use client"

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/**
 * Componente interno para rastrear mudanças de rota (usando hooks que precisam de Suspense)
 */
function RouteTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se a função trackRouteChange foi definida (no script de inicialização do GA4)
    if (typeof window !== 'undefined' && typeof (window as any).trackRouteChange === 'function') {
      // Construir a URL completa com base no pathname e searchParams
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      
      // Chamar a função de rastreamento definida no Script de inicialização
      ;(window as any).trackRouteChange(url)
      
      console.log(`[GA4 Route Tracker] Mudança de rota rastreada: ${url}`)
    }
  }, [pathname, searchParams])

  // Este componente não renderiza nada visualmente
  return null
}

/**
 * Componente principal que envolve o rastreador de rota em um Suspense para evitar erros de SSR
 */
export default function GA4RouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  )
} 