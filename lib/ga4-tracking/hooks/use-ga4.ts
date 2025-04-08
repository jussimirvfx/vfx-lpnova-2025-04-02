/**
 * Hook para uso do GA4
 * Equivalente ao useMetaPixel, mas para o GA4
 */

import { useCallback, useState, useEffect } from 'react';
import { initializeGA4, sendEvent, trackPageView, mapMetaEventToGA4 } from '../core/ga4-client';

/**
 * Hook para uso do GA4
 * 
 * @returns Objeto com funções e estado do GA4
 */
export function useGA4() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Inicializar o GA4
  const initialize = useCallback(() => {
    const initialized = initializeGA4();
    setIsInitialized(initialized);
    return initialized;
  }, []);
  
  // Enviar evento para o GA4
  const trackEvent = useCallback((
    eventName: string,
    params: Record<string, any> = {},
    options: {
      skipDeduplication?: boolean;
      sendToServer?: boolean;
    } = {}
  ) => {
    return sendEvent(eventName, params, options);
  }, []);
  
  // Enviar evento page_view para o GA4
  const trackPageViewEvent = useCallback((params: Record<string, any> = {}) => {
    return trackPageView(params);
  }, []);
  
  // Enviar evento de Meta convertido para GA4
  const trackMetaEventAsGA4 = useCallback((
    metaEventName: string,
    params: Record<string, any> = {},
    options: {
      skipDeduplication?: boolean;
      sendToServer?: boolean;
    } = {}
  ) => {
    const ga4EventName = mapMetaEventToGA4(metaEventName);
    return sendEvent(ga4EventName, params, options);
  }, []);
  
  // Verificar se o GA4 já está inicializado ao montar o componente
  useEffect(() => {
    if (typeof window !== 'undefined' && window._ga4Initialized) {
      setIsInitialized(true);
    }
  }, []);
  
  return {
    isInitialized,
    initialize,
    trackEvent,
    trackPageView: trackPageViewEvent,
    trackMetaEventAsGA4,
  };
} 