"use client"

import { useGA4 } from "@/lib/hooks/use-ga4"
import { GA4_CONFIG } from "@/lib/config/ga4"
import { useEffect, useState } from "react"
import ga4Logger from "@/lib/utils/ga4-logger"
import { LogCategory } from "@/lib/types"

/**
 * Estender a interface Window para incluir a função sendGAEvent
 */
declare global {
  interface Window {
    sendGAEvent?: (
      eventName: string, 
      params?: Record<string, any>, 
      options?: { 
        eventID?: string;
        nonInteraction?: boolean;
      }
    ) => void;
    _ga4Initialized: boolean;
  }
}

interface GA4ProviderProps {
  children: React.ReactNode
}

/**
 * Provider para o Google Analytics 4
 * Gerencia a inicialização e disponibiliza métodos globais para tracking
 */
export function GA4Provider({ children }: GA4ProviderProps) {
  const { initializeGA4, trackEvent, trackPageView, isInitialized } = useGA4()
  const [initializationCompleted, setInitializationCompleted] = useState(false)

  // Disponibilizar função global para envio de eventos
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Criar função global para envio de eventos
    window.sendGAEvent = (eventName, params, options) => {
      return trackEvent(eventName, params || {}, {
        eventId: options?.eventID,
        nonInteraction: options?.nonInteraction
      })
    }
    
    return () => {
      // Limpar quando o componente for desmontado
      delete window.sendGAEvent
    }
  }, [trackEvent])

  // Efeito para inicializar o GA4 uma vez
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Garantir que a propriedade _ga4Initialized exista
    if (typeof window._ga4Initialized === 'undefined') {
      window._ga4Initialized = false;
    }
    
    // Evita múltiplas inicializações
    if (window._ga4Initialized) {
      ga4Logger.debug(LogCategory.INIT, "GA4 já inicializado anteriormente, pulando inicialização", {
        measurementId: GA4_CONFIG.MEASUREMENT_ID
      })
      setInitializationCompleted(true)
      return
    }

    // Log de inicialização
    ga4Logger.info(
      LogCategory.INIT, 
      "Iniciando provider do GA4", 
      { 
        measurementId: GA4_CONFIG.MEASUREMENT_ID,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    )

    // Iniciar rastreamento dos eventos do GA4
    // Coloca um pequeno delay para garantir que o script base foi carregado
    setTimeout(() => {
      initializeGA4(GA4_CONFIG.MEASUREMENT_ID)
      
      // Marca como inicializado globalmente para evitar dupla inicialização
      window._ga4Initialized = true
      setInitializationCompleted(true)
      
      // Diagnóstico das variáveis de ambiente
      if (process.env.NODE_ENV === 'development') {
        console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 ====================')
        console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID:', GA4_CONFIG.MEASUREMENT_ID || 'Não configurado')
        console.log('===================================================================')
      }
    }, 200)
  }, [initializeGA4])

  return children
} 