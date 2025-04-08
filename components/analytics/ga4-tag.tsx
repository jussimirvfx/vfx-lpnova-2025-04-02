"use client"

import { useGA4 } from "@/lib/hooks/use-ga4"
import { useEffect } from "react"
import Script from "next/script"
import { GA4_CONFIG } from "@/lib/config/ga4"
import { LogCategory } from "@/lib/types"
import ga4Logger from "@/lib/utils/ga4-logger"

interface GA4TagProps {
  measurementId: string
}

/**
 * Componente GA4 Tag
 * Responsável por renderizar o script base do GA4 e disparar o PageView inicial.
 * A inicialização é gerenciada pelo GA4Provider.
 * 
 * IMPORTANTE:
 * 1. Este componente NÃO faz a inicialização (gtag('config')) - isso é responsabilidade do useGA4
 * 2. Apenas carrega o script base do Google Analytics e configura o dataLayer
 * 3. O PageView inicial é disparado após a inicialização completa
 * 4. Usamos strategy="afterInteractive" para melhorar a performance
 */
export function GA4Tag({ measurementId }: GA4TagProps) {
  const { isInitialized, trackPageView } = useGA4()

  // Disparar PageView inicial quando o GA4 estiver inicializado
  useEffect(() => {
    if (isInitialized) {
      trackPageView()
    }
  }, [isInitialized, trackPageView])

  return (
    <>
      {/* 
        Script principal do GA4
        - Usamos strategy="afterInteractive" para carregar após o conteúdo principal
        - Adicionamos verificações para evitar carregamentos duplicados
      */}
      <Script
        id="ga4-base-script"
        strategy="afterInteractive"
        onLoad={() => {
          ga4Logger.info(LogCategory.INIT, "Script do Google Analytics carregado com sucesso")
        }}
        onError={(e) => {
          ga4Logger.error(LogCategory.INIT, "Erro ao carregar script do Google Analytics", e)
        }}
      >
        {`
          // Inicialização do dataLayer
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          // Configuração inicial
          gtag('js', new Date());
          
          // Marcar como carregado para evitar duplicações
          window._ga4ScriptLoaded = true;
          
          // Log para Debug
          console.log('[GA4] Base script loaded successfully');
        `}
      </Script>

      {/* Script principal do GA4 - Tag Manager */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
    </>
  )
} 