"use client"

import { useGA4 } from "../hooks/use-ga4"
import { GA4_CONFIG } from "../config/ga4-config"
import { useEffect, useState } from "react"
import { createContext, useContext } from "react"

// Tipo para o contexto
type GA4ContextType = {
  isInitialized: boolean;
  trackEvent: (
    eventName: string,
    params?: Record<string, any>,
    options?: {
      skipDeduplication?: boolean;
      sendToServer?: boolean;
    }
  ) => Promise<boolean>;
  trackPageView: (params?: Record<string, any>) => Promise<boolean>;
  trackMetaEventAsGA4: (
    metaEventName: string,
    params?: Record<string, any>,
    options?: {
      skipDeduplication?: boolean;
      sendToServer?: boolean;
    }
  ) => Promise<boolean>;
};

// Criar o contexto com valores padrão
const GA4Context = createContext<GA4ContextType>({
  isInitialized: false,
  trackEvent: async () => false,
  trackPageView: async () => false,
  trackMetaEventAsGA4: async () => false,
});

// Hook para usar o contexto
export const useGA4Context = () => useContext(GA4Context);

interface GA4ProviderProps {
  children: React.ReactNode
}

/**
 * GA4 Provider
 * 
 * IMPORTANTE: Este componente é responsável por:
 * 1. Inicializar o GA4 (gtag) uma única vez na aplicação
 * 2. Garantir que o page_view inicial seja disparado após a inicialização
 * 3. Gerenciar estado de inicialização e evitar duplicações
 * 4. Recarregar eventos page_view em mudanças de rota
 * 5. Disponibilizar a função global window.sendGA4Event para todos os componentes
 * 
 * Coexiste com o MetaPixelProvider sem interferências
 */
export function GA4Provider({ children }: GA4ProviderProps) {
  const { initialize, trackEvent, trackPageView, trackMetaEventAsGA4, isInitialized } = useGA4()
  const [pageViewSent, setPageViewSent] = useState(false)
  const [initializationCompleted, setInitializationCompleted] = useState(false)

  // Efeito para inicializar o GA4 uma vez
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Evita múltiplas inicializações - aguardar gtag estar disponível
    const initializeGA4 = () => {
      // Verificar se o contêiner já foi inicializado
      if (window._ga4Initialized) {
        console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] GA4 já inicializado anteriormente, pulando inicialização`)
        setInitializationCompleted(true)
        return
      }
      
      // Se o gtag não estiver disponível, esperar um pouco mais
      if (!window.gtag) {
        setTimeout(initializeGA4, 500)
        return
      }
      
      initialize()
      setInitializationCompleted(true)
      
      // Diagnóstico das variáveis de ambiente
      if (process.env.NODE_ENV === 'development') {
        console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 ====================')
        console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID status:', GA4_CONFIG.MEASUREMENT_ID ? 'Configurado' : 'Não configurado')
        console.log('GA4_API_SECRET status:', GA4_CONFIG.API_SECRET ? 'Configurado (não visível no cliente)' : 'Não configurado')
        console.log('===================================================================')
      }
    }
    
    // Iniciar verificação com um pequeno delay para garantir que os scripts já foram carregados
    setTimeout(initializeGA4, 1000)
  }, [initialize])

  // Efeito para enviar PageView após a inicialização
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!initializationCompleted || !isInitialized) return
    if (pageViewSent) return

    // Garantir que o PageView seja chamado após o carregamento completo da página
    const timer = setTimeout(() => {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Enviando page_view inicial após inicialização`)
      
      // Pequeno delay para garantir que tudo está carregado
      setTimeout(() => {
        trackPageView()
        setPageViewSent(true)
        
        console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] page_view inicial enviado`)
      }, 100)
    }, 800) // Um pouco mais do que o Meta Pixel para priorizar o Meta
    
    return () => clearTimeout(timer)
  }, [isInitialized, trackPageView, pageViewSent, initializationCompleted])

  // Efeito para enviar PageView em mudanças de rota
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const handleRouteChange = () => {
      // Resetar o estado em mudanças de rota
      setPageViewSent(false)
    }
    
    // Adicionar listener para mudanças de URL
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  return (
    <GA4Context.Provider
      value={{
        isInitialized,
        trackEvent,
        trackPageView,
        trackMetaEventAsGA4,
      }}
    >
      {children}
    </GA4Context.Provider>
  )
} 