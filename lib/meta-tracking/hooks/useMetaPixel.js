"use client";

import { useState, useCallback, useEffect } from 'react';
import { getConfig } from '../config';
import { initializeMetaPixel, isPixelInitialized } from '../core/initialize';
import { logger, LogCategory } from '../core/logger';
import { trackPageView } from '../events/page-view';

/**
 * Hook para usar o Meta Pixel em componentes React
 * @returns {Object} - Métodos e estado do Meta Pixel
 */
export function useMetaPixel() {
  const [isInitialized, setIsInitialized] = useState(false);
  const config = getConfig();

  // Verificar se já está inicializado no cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isPixelInitialized()) {
      setIsInitialized(true);
    }
  }, []);

  // Inicializar o Meta Pixel
  const initialize = useCallback((pixelIdOverride) => {
    if (typeof window === 'undefined') return;
    
    const pixelId = pixelIdOverride || config.PIXEL_ID;
    if (!pixelId) {
      logger.error(LogCategory.INIT, 'Meta Pixel ID não configurado');
      return;
    }
    
    const result = initializeMetaPixel(pixelId);
    
    if (result.isInitialized) {
      setIsInitialized(true);
    }
    
    return result;
  }, [config.PIXEL_ID]);

  // Rastrear PageView
  const trackPage = useCallback(async (options = {}) => {
    if (!isInitialized) {
      logger.warn(LogCategory.PAGEVIEW, 'Meta Pixel não inicializado para PageView');
      return false;
    }
    
    return trackPageView(options);
  }, [isInitialized]);

  // Rastrear evento genérico
  const trackEvent = useCallback(async (eventName, data = {}, options = {}) => {
    if (!isInitialized) {
      logger.warn(LogCategory.EVENT, `Meta Pixel não inicializado para evento ${eventName}`);
      return false;
    }
    
    if (!eventName) {
      logger.error(LogCategory.EVENT, 'Nome do evento não fornecido');
      return false;
    }
    
    try {
      logger.info(LogCategory.EVENT, `Iniciando rastreamento de evento: ${eventName}`, data);
      
      // Verificar se o evento existe no módulo correspondente
      switch (eventName) {
        case 'PageView':
          return trackPageView(options);
          
        // Implementar outros eventos conforme necessário
        default:
          // Tratamento genérico para eventos não implementados
          logger.warn(LogCategory.EVENT, `Evento não implementado: ${eventName}. Usando implementação genérica.`);
          
          if (typeof window !== 'undefined' && window.fbq) {
            // Enviar evento genérico
            const eventId = options.eventId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            window.fbq('track', eventName, data, { eventID: eventId });
            
            logger.info(LogCategory.EVENT, `Evento genérico enviado: ${eventName}`, { eventId });
            return true;
          }
          
          return false;
      }
    } catch (error) {
      logger.error(LogCategory.EVENT, `Erro ao rastrear evento ${eventName}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }, [isInitialized]);

  return {
    isInitialized,
    initialize,
    trackPage,
    trackEvent
  };
} 