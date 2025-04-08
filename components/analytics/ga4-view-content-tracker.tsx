"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGA4Context } from '@/lib/ga4-tracking/context/ga4-provider'
import { isEventAlreadySent, markEventAsSent } from '@/lib/ga4-tracking/core/event-deduplication'

/**
 * Componente para rastrear eventos view_item (ViewContent) no GA4
 * Dispara em páginas específicas como /apresentacao
 */
export default function GA4ViewContentTracker() {
  const pathname = usePathname()
  const { trackEvent } = useGA4Context()
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Verificar se estamos em uma página que deve disparar view_item
    if (pathname && pathname.includes('apresentacao')) {
      const identifier = pathname
      
      // Verificar se já disparamos o evento para esta página
      if (!isEventAlreadySent('view_item', identifier)) {
        // Disparar o evento view_item
        setTimeout(() => {
          trackEvent('view_item', {
            item_name: 'Apresentação',
            item_category: 'Portfolio',
            page_location: window.location.href,
            page_path: pathname,
          }, {
            // Enviar para o servidor também para registrar precisamente
            sendToServer: true
          })
          
          // Marcar como enviado
          markEventAsSent('view_item', identifier)
        }, 1000) // Delay para garantir que a página carregou completamente
      }
    }
  }, [pathname, trackEvent])
  
  return null
} 