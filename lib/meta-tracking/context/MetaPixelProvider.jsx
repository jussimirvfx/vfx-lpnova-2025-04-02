"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useMetaPixel } from '../hooks/useMetaPixel';
import { logger, LogCategory } from '../core/logger';

// Criar contexto
const MetaPixelContext = createContext({
  isInitialized: false,
  trackPage: () => Promise.resolve(false),
  trackEvent: () => Promise.resolve(false)
});

/**
 * Hook para usar o contexto do Meta Pixel
 * @returns {Object} Contexto do Meta Pixel
 */
export function useMetaPixelContext() {
  return useContext(MetaPixelContext);
}

/**
 * Provider para o Meta Pixel
 * @param {Object} props - Propriedades do componente
 * @param {ReactNode} props.children - Componentes filhos
 * @returns {JSX.Element} Componente Provider
 */
export function MetaPixelProvider({ children }) {
  const { initialize, isInitialized, trackPage, trackEvent } = useMetaPixel();
  const [initializationCompleted, setInitializationCompleted] = useState(false);
  const [firstPageViewSent, setFirstPageViewSent] = useState(false);

  // Inicializar o Meta Pixel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Evitar inicialização múltipla
    if (window._fbPixelInitialized) {
      logger.debug(LogCategory.INIT, 'Meta Pixel já inicializado anteriormente, pulando inicialização');
      setInitializationCompleted(true);
      return;
    }

    // Log de inicialização
    logger.info(LogCategory.INIT, 'Iniciando provider do Meta Pixel', { 
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Inicializar o Meta Pixel com um pequeno atraso
    setTimeout(() => {
      initialize();
      setInitializationCompleted(true);
      
      // Marcar para que o pixel não seja inicializado novamente
      window._fbPixelInitialized = true;
    }, 200);
  }, [initialize]);

  // Enviar PageView inicial após inicialização
  useEffect(() => {
    if (!initializationCompleted || !isInitialized || firstPageViewSent) return;

    // Enviar PageView inicial
    logger.info(LogCategory.PAGEVIEW, 'Enviando PageView inicial após inicialização do Meta Pixel');
    
    trackPage()
      .then(success => {
        if (success) {
          setFirstPageViewSent(true);
        }
      })
      .catch(error => {
        logger.error(LogCategory.PAGEVIEW, 'Erro ao enviar PageView inicial', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
  }, [initializationCompleted, isInitialized, firstPageViewSent, trackPage]);

  // Configurar para rastrear alterações de rota no Next.js
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initializationCompleted || !isInitialized) return;

    // Handler para mudanças de rota
    const handleRouteChange = () => {
      logger.debug(LogCategory.PAGEVIEW, 'Detectada mudança de rota, enviando PageView');
      
      // Não usar setFirstPageViewSent aqui, pois cada navegação deve enviar um PageView
      trackPage()
        .catch(error => {
          logger.error(LogCategory.PAGEVIEW, 'Erro ao enviar PageView em mudança de rota', {
            error: error instanceof Error ? error.message : String(error)
          });
        });
    };

    // Adicionar listener para o evento popstate (navegação do histórico)
    window.addEventListener('popstate', handleRouteChange);

    // Limpar ao desmontar
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [initializationCompleted, isInitialized, trackPage]);

  // Valor do contexto
  const contextValue = {
    isInitialized: isInitialized && initializationCompleted,
    trackPage,
    trackEvent
  };

  return (
    <MetaPixelContext.Provider value={contextValue}>
      {children}
    </MetaPixelContext.Provider>
  );
} 