"use client";

import { useEffect } from 'react';
import { useMetaPixel } from '@/lib/meta-tracking/hooks/useMetaPixel';
import { logger, LogCategory } from '@/lib/meta-tracking/core/logger';

/**
 * Componente para inicializar o Meta Pixel
 * Este componente deve ser incluído no layout principal da aplicação
 * @returns {null} Não renderiza nada visível
 */
export function MetaPixelInitializer() {
  const { initialize, isInitialized, trackPage } = useMetaPixel();
  
  // Inicializar o Pixel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inicializar o Meta Pixel
    logger.info(LogCategory.INIT, 'Inicializando Meta Pixel via MetaPixelInitializer');
    initialize();
  }, [initialize]);
  
  // Rastrear PageView após inicialização
  useEffect(() => {
    if (!isInitialized) return;
    
    // Enviar PageView inicial
    logger.info(LogCategory.PAGEVIEW, 'Enviando PageView inicial via MetaPixelInitializer');
    trackPage();
    
    // Configurar para rastrear alterações de rota no Next.js
    const handleRouteChange = () => {
      logger.info(LogCategory.PAGEVIEW, 'Detectada mudança de rota, enviando PageView');
      trackPage();
    };
    
    // Adicionar listeners para mudanças de rota
    window.addEventListener('popstate', handleRouteChange);
    
    // Limpar ao desmontar
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isInitialized, trackPage]);
  
  // Não renderiza nada visível
  return null;
} 