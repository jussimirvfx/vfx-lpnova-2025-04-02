"use client"

import { useEffect } from "react"
import { useGA4Context } from "@/lib/ga4-tracking/context/ga4-provider"
import Script from 'next/script'
import { GA4_CONFIG } from '@/lib/ga4-tracking/config/ga4-config'

interface GA4TrackerProps {
  measurementId: string
}

/**
 * Componente GA4Tracker
 * Responsável por renderizar o script base do GA4 e disparar o PageView inicial.
 * A inicialização é gerenciada pelo GA4Provider.
 * 
 * IMPORTANTE:
 * 1. Este componente NÃO faz a inicialização (gtag('js', new Date())) - isso é responsabilidade do useGA4
 * 2. Apenas carrega o script base do Google Analytics e configura o dataLayer
 * 3. O page_view inicial é disparado após a inicialização completa pelo Provider
 */
export function GA4Tracker({ measurementId }: GA4TrackerProps) {
  const { isInitialized, trackPageView } = useGA4Context()

  // Disparar page_view inicial quando o GA4 estiver inicializado
  useEffect(() => {
    if (isInitialized) {
      trackPageView()
    }
  }, [isInitialized, trackPageView])

  return (
    <>
      {/* Script principal do GA4 */}
      <Script
        id="ga4-base-script"
        strategy="afterInteractive"
        onLoad={() => {
          console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Script do GA4 carregado com sucesso`)
        }}
        onError={(e) => {
          console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao carregar script do GA4:`, e)
        }}
      >
        {`
          // Verificação para evitar carregamento duplicado
          if (typeof window !== 'undefined' && !window._ga4ScriptLoaded) {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', { send_page_view: false });
            
            // Marcar como carregado para evitar duplicações
            window._ga4ScriptLoaded = true;
            
            // Log para Debug
            console.log('[GA4] Base script loaded successfully');
          }
        `}
      </Script>

      {/* Carregar o script do gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        id="ga4-gtag-script"
      />
    </>
  )
} 