"use client"

import { useMetaPixel } from "@/lib/hooks/use-meta-pixel"
import { META_PIXEL_CONFIG } from "@/lib/config/meta-pixel"
import { useEffect, useState } from "react"
import logger, { LogCategory } from "@/lib/utils/logger"

/**
 * Estender a interface Window para incluir a função sendMetaEvent
 */
declare global {
  interface Window {
    sendMetaEvent?: (
      eventName: string, 
      params?: Record<string, any>, 
      options?: { 
        eventID?: string;
        user_data?: Record<string, any>;
      }
    ) => void;
    _fbPixelInitialized?: boolean;
  }
}

interface MetaPixelProviderProps {
  children: React.ReactNode
}

/**
 * Meta Pixel Provider
 * 
 * IMPORTANTE: Este componente é responsável por:
 * 1. Inicializar o Facebook Pixel (fbq('init')) uma única vez na aplicação
 * 2. Garantir que o PageView inicial seja disparado após a inicialização
 * 3. Gerenciar estado de inicialização e evitar duplicações
 * 4. Recarregar eventos PageView em mudanças de rota
 * 5. Disponibilizar a função global window.sendMetaEvent para todos os componentes
 * 
 * DIAGNÓSTICO DE PROBLEMAS COMUNS:
 * - Erro 'Multiple pixels with conflicting versions': 
 *   Certifique-se que o script seja carregado apenas uma vez e que o preload no layout.tsx está configurado
 * - Erro '401' no manifest.json:
 *   Verifique se o arquivo está presente e com MIME type correto (application/manifest+json)
 * - Erro 'Invalid parameter' na API de Conversão:
 *   Verifique se os parâmetros obrigatórios estão sendo enviados (user_data com client_ip_address, fbp, etc)
 * - Erro 'window.sendMetaEvent não disponível':
 *   Verifique se este provider está sendo carregado antes de qualquer componente que use eventos
 */
export function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  const { initializePixel, trackEvent, trackPageView, isInitialized } = useMetaPixel()
  const [pageViewSent, setPageViewSent] = useState(false)
  const [initializationCompleted, setInitializationCompleted] = useState(false)

  // Efeito para definir a função global sendMetaEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Definir a função sendMetaEvent no objeto window se ainda não existir
    if (!window.sendMetaEvent) {
      window.sendMetaEvent = (eventName, params = {}, options = {}) => {
        logger.info(
          LogCategory.META_PIXEL,
          `Enviando evento ${eventName} via window.sendMetaEvent`,
          { 
            hasParams: Object.keys(params).length > 0, 
            hasOptions: Object.keys(options).length > 0
          }
        );
        
        return trackEvent(eventName, params, options);
      };
      
      logger.info(
        LogCategory.INIT,
        'Função window.sendMetaEvent definida globalmente',
        { timestamp: Date.now() }
      );
    }
  }, [trackEvent]);

  // Efeito para inicializar o Meta Pixel uma vez
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Evita múltiplas inicializações
    if (window._fbPixelInitialized) {
      logger.debug(LogCategory.INIT, "Meta Pixel já inicializado anteriormente, pulando inicialização", {
        pixelId: META_PIXEL_CONFIG.PIXEL_ID
      })
      setInitializationCompleted(true)
      return
    }

    // Log de inicialização
    logger.info(
      LogCategory.INIT, 
      "Iniciando provider do Meta Pixel", 
      { 
        pixelId: META_PIXEL_CONFIG.PIXEL_ID,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    )

    // Iniciar rastreamento dos eventos do Facebook
    // Coloca um pequeno delay para garantir que o script base foi carregado
    setTimeout(() => {
      initializePixel(META_PIXEL_CONFIG.PIXEL_ID)
      
      // Marca como inicializado globalmente para evitar dupla inicialização
      window._fbPixelInitialized = true
      setInitializationCompleted(true)
      
      // Diagnóstico das variáveis de ambiente
      if (process.env.NODE_ENV === 'development') {
        console.log('==================== DIAGNÓSTICO DE VARIÁVEIS META ====================')
        console.log('META_API_ACCESS_TOKEN status:', META_PIXEL_CONFIG.ACCESS_TOKEN ? 'Configurado' : 'Não configurado')
        console.log('META_TEST_EVENT_CODE:', META_PIXEL_CONFIG.TEST_EVENT_CODE || 'Não configurado')
        console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', META_PIXEL_CONFIG.PIXEL_ID || 'Não configurado')
        console.log('===================================================================')
      }
    }, 200)
    
    // Log para confirmar inicio e expor interface de logs no console
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.info(
        '[Debug] Sistema de logs do Meta Pixel ativado. Use window._metaPixelLogs no console para acessar.'
      )
    }
  }, [initializePixel])

  // Efeito para enviar PageView após a inicialização
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!initializationCompleted || !isInitialized) return
    if (pageViewSent) return

    // Garantir que o PageView seja chamado após o carregamento completo da página
    // Usamos um timer com mais delay (500ms) para garantir que todos os cookies estejam configurados
    const timer = setTimeout(() => {
      logger.info(
        LogCategory.PAGE_VIEW, 
        "Enviando PageView inicial após inicialização do Meta Pixel",
        { 
          url: window.location.href,
          title: document.title,
          timestamp: Date.now(),
          cookies: document.cookie
        }
      )
      
      // Aguardar mais 100ms para garantir que o cookie _fbp tenha sido configurado
      setTimeout(() => {
        trackPageView()
        setPageViewSent(true)
        
        logger.debug(
          LogCategory.PAGE_VIEW, 
          "PageView inicial enviado",
          { 
            timestamp: Date.now(),
            url: window.location.href
          }
        )
      }, 100)
    }, 500) // Pequeno delay para garantir que tudo está carregado
    
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

  return <>{children}</>
} 