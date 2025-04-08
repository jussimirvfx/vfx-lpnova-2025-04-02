"use client";

import { useState, useCallback, useEffect } from 'react';
import { GA4_CONFIG } from '@/lib/config/ga4';
import { LogCategory, GA4PageViewOptions, GA4EventOptions, UseGA4Return } from '@/lib/types';
import ga4Logger from '@/lib/utils/ga4-logger';
import { generateEventId } from '@/lib/utils/event-utils';

// Constantes
const MAX_RETRIES = 3;

/**
 * Hook para usar o GA4 em componentes React
 */
export function useGA4(): UseGA4Return {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Verificar se já está inicializado no cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (window._ga4Initialized) {
      setIsInitialized(true);
    }
  }, []);

  /**
   * Inicializa o Google Analytics 4
   */
  const initializeGA4 = useCallback((measurementIdOverride?: string) => {
    if (typeof window === 'undefined') {
      return { isInitialized: false, error: 'Ambiente de servidor não suportado' };
    }
    
    const measurementId = measurementIdOverride || GA4_CONFIG.MEASUREMENT_ID;
    
    if (!measurementId) {
      ga4Logger.error(LogCategory.INIT, 'Não foi possível inicializar: Measurement ID não fornecido');
      return { isInitialized: false, error: 'Measurement ID não fornecido' };
    }
    
    // Verifique se já inicializado
    if (window._ga4Initialized) {
      ga4Logger.info(LogCategory.INIT, 'GA4 já inicializado, ignorando', { measurementId });
      return { isInitialized: true, measurementId };
    }
    
    try {
      // Verificar se o script foi carregado
      if (!window._ga4ScriptLoaded || typeof window.gtag !== 'function') {
        ga4Logger.warn(LogCategory.INIT, 'Script do GA4 ainda não carregado, tentando inicializar manualmente');
        
        // Inicializar diretamente se o script não foi carregado
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(){
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
      }
      
      // Configurar o GA4 com o ID de medição
      window.gtag('config', measurementId, {
        send_page_view: false, // Desabilitar o PageView automático
      });
      
      // Marcar como inicializado
      window._ga4Initialized = true;
      setIsInitialized(true);
      
      ga4Logger.info(LogCategory.INIT, 'GA4 inicializado com sucesso', { 
        measurementId, 
        timestamp: Date.now() 
      });
      
      // Diagnóstico em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 ====================');
        console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID:', GA4_CONFIG.MEASUREMENT_ID || 'Não configurado');
        console.log('===================================================================');
      }
      
      return { isInitialized: true, measurementId };
    } catch (error) {
      ga4Logger.error(LogCategory.INIT, 'Erro ao inicializar GA4', { 
        error: error instanceof Error ? error.message : String(error),
        measurementId
      });
      
      return { isInitialized: false, error };
    }
  }, []);

  /**
   * Rastreia um evento de visualização de página
   */
  const trackPageView = useCallback(async (options: GA4PageViewOptions = {}) => {
    if (typeof window === 'undefined') return false;
    
    if (!isInitialized) {
      ga4Logger.warn(LogCategory.PAGEVIEW, 'GA4 não inicializado para PageView');
      return false;
    }
    
    try {
      const eventId = generateEventId();
      const path = options.path || window.location.pathname + window.location.search;
      const title = options.title || document.title;
      
      const params = {
        page_title: title,
        page_location: window.location.href,
        page_path: path,
        send_to: GA4_CONFIG.MEASUREMENT_ID,
        ...options.additionalParams
      };
      
      // Log detalhado
      ga4Logger.info(LogCategory.PAGEVIEW, `Enviando PageView para: ${path}`, { 
        title, 
        eventId,
        path
      });
      
      // Enviar via gtag
      window.gtag('event', 'page_view', params);
      
      // Enviar servidor se necessário (opcionalmente pode ser implementado)
      
      return true;
    } catch (error) {
      ga4Logger.error(LogCategory.PAGEVIEW, 'Erro ao rastrear PageView', {
        error: error instanceof Error ? error.message : String(error),
        path: options.path || window.location.pathname
      });
      
      return false;
    }
  }, [isInitialized]);

  /**
   * Rastreia um evento personalizado no GA4
   */
  const trackEvent = useCallback(async (name: string, params: Record<string, any> = {}, options: GA4EventOptions = {}) => {
    if (typeof window === 'undefined') return false;
    
    if (!isInitialized) {
      ga4Logger.warn(LogCategory.EVENT, `GA4 não inicializado para evento: ${name}`);
      return false;
    }
    
    try {
      const eventId = options.eventId || generateEventId();
      
      // Log detalhado
      ga4Logger.info(LogCategory.EVENT, `Enviando evento: ${name}`, { 
        params, 
        eventId
      });
      
      // Adicionar send_to para garantir que o evento vá para a property correta
      const eventParams = {
        ...params,
        send_to: GA4_CONFIG.MEASUREMENT_ID,
        event_id: eventId,
        non_interaction: options.nonInteraction === true
      };
      
      // Enviar via gtag
      window.gtag('event', name, eventParams);
      
      // Enviar para o servidor via API se solicitado
      if (options.sendToServerAPI) {
        try {
          await fetch('/api/ga4-measurement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              params: eventParams,
              event_id: eventId
            }),
          });
        } catch (apiError) {
          ga4Logger.error(LogCategory.MEASUREMENT_API, `Erro ao enviar evento via API: ${name}`, {
            error: apiError instanceof Error ? apiError.message : String(apiError),
            eventId
          });
        }
      }
      
      return true;
    } catch (error) {
      ga4Logger.error(LogCategory.EVENT, `Erro ao rastrear evento: ${name}`, {
        error: error instanceof Error ? error.message : String(error),
        params
      });
      
      return false;
    }
  }, [isInitialized]);

  /**
   * Rastreia uma conversão do Google Ads
   */
  const trackConversion = useCallback(async (conversionId: string, conversionLabel: string, params: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return false;
    
    if (!isInitialized) {
      ga4Logger.warn(LogCategory.CONVERSION, 'GA4 não inicializado para conversão do Google Ads');
      return false;
    }
    
    try {
      // Log detalhado
      ga4Logger.info(LogCategory.CONVERSION, `Enviando conversão do Google Ads`, { 
        conversionId, 
        conversionLabel,
        params
      });
      
      // Enviar via gtag
      window.gtag('event', 'conversion', {
        send_to: `${conversionId}/${conversionLabel}`,
        ...params
      });
      
      return true;
    } catch (error) {
      ga4Logger.error(LogCategory.CONVERSION, 'Erro ao rastrear conversão do Google Ads', {
        error: error instanceof Error ? error.message : String(error),
        conversionId, 
        conversionLabel
      });
      
      return false;
    }
  }, [isInitialized]);

  return {
    isInitialized,
    initializeGA4,
    trackPageView,
    trackEvent,
    trackConversion
  };
} 