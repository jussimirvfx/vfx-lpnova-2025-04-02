"use client";

import { useEffect } from 'react';
import { useGA4 } from '@/lib/ga4-tracking/hooks/useGA4';
import { logger, LogCategory } from '@/lib/ga4-tracking/core/logger';

/**
 * Componente para inicializar o GA4
 * Este componente deve ser incluído no layout principal da aplicação
 * @returns {null} Não renderiza nada visível
 */
export function GA4Initializer() {
  const { initialize, isInitialized, trackPageView } = useGA4();
  
  // Inicializar o GA4
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inicializar o Google Analytics 4
    logger.info(LogCategory.INIT, 'Inicializando GA4 via GA4Initializer');
    initialize();
  }, [initialize]);
  
  // Rastrear PageView após inicialização
  useEffect(() => {
    if (!isInitialized) return;
    
    // Enviar PageView inicial
    logger.info(LogCategory.PAGEVIEW, 'Enviando PageView inicial via GA4Initializer');
    trackPageView();
    
    // Configurar para rastrear alterações de rota no Next.js
    const handleRouteChange = () => {
      logger.info(LogCategory.PAGEVIEW, 'Detectada mudança de rota, enviando PageView GA4');
      trackPageView();
    };
    
    // Adicionar listeners para mudanças de rota
    window.addEventListener('popstate', handleRouteChange);
    
    // Limpar ao desmontar
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isInitialized, trackPageView]);
  
  // Não renderiza nada visível
  return null;
} 