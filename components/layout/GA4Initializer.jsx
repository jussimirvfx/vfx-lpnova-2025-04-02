"use client";

import { useEffect } from 'react';
import { useGA4 } from '@/lib/ga4-tracking/hooks/useGA4';
import { logger, LogCategory } from '@/lib/ga4-tracking/core/logger';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Componente para inicializar o GA4
 * Este componente deve ser incluído no layout principal da aplicação
 * @returns {null} Não renderiza nada visível
 */
export function GA4Initializer() {
  const { initialize, isInitialized, trackPageView } = useGA4();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializar o GA4
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inicializar o Google Analytics 4
    logger.info(LogCategory.INIT, 'Inicializando GA4 via GA4Initializer');
    
    const initResult = initialize();
    
    if (initResult && initResult.isInitialized === false) {
      console.warn('[GA4] Falha na inicialização do GA4. Verifique se a variável de ambiente NEXT_PUBLIC_GA4_MEASUREMENT_ID está configurada.');
    }
  }, [initialize]);
  
  // Rastrear mudanças de rota usando pathname e searchParams do Next.js 13+
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    logger.info(LogCategory.PAGEVIEW, `Enviando PageView para: ${url}`);
    
    // Enviar pageview com informações detalhadas
    trackPageView({
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
      search_term: searchParams.get('q') || searchParams.get('search') || undefined,
    });
    
  }, [isInitialized, pathname, searchParams, trackPageView]);
  
  // Rastrear primeira pageview após a inicialização
  useEffect(() => {
    if (!isInitialized) return;
    
    // Enviar PageView inicial
    logger.info(LogCategory.PAGEVIEW, 'Enviando PageView inicial após inicialização do GA4');
    trackPageView({
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
    });
    
    // Também monitorar eventos de histórico do navegador (botões voltar/avançar)
    const handlePopState = () => {
      setTimeout(() => {
        logger.info(LogCategory.PAGEVIEW, 'Detectado popstate, enviando PageView');
        trackPageView({
          page_path: window.location.pathname,
          page_location: window.location.href,
          page_title: document.title,
        });
      }, 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInitialized, trackPageView]);
  
  // Não renderiza nada visível
  return null;
} 