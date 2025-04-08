"use client";

import { useState, useCallback, useEffect } from 'react';
import { getConfig } from '../config';
import { initializeGA4, isGA4Initialized } from '../core/initialize';
import { logger, LogCategory } from '../core/logger';
import { sendEvent } from '../api/send-event';
import { prepareEventParameters } from '../core/data-collector';
import { 
  setUserId, 
  getUserId, 
  setUserProperty, 
  setUserProperties, 
  getUserProperties,
  clearUserData 
} from '../core/user-data';

/**
 * Hook para usar o GA4 em componentes React
 * @returns {Object} - Métodos e estado do GA4
 */
export function useGA4() {
  const [isInitialized, setIsInitialized] = useState(false);
  const config = getConfig();

  // Verificar se já está inicializado no cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isGA4Initialized()) {
      setIsInitialized(true);
    }
  }, []);

  // Inicializar o GA4
  const initialize = useCallback((measurementIdOverride) => {
    if (typeof window === 'undefined') return;
    
    const measurementId = measurementIdOverride || config.MEASUREMENT_ID;
    if (!measurementId) {
      logger.error(LogCategory.INIT, 'GA4 Measurement ID não configurado');
      return;
    }
    
    const result = initializeGA4(measurementId);
    
    if (result.isInitialized) {
      setIsInitialized(true);
    }
    
    return result;
  }, [config.MEASUREMENT_ID]);

  // Rastrear PageView
  const trackPageView = useCallback(async (params = {}) => {
    if (!isInitialized) {
      logger.warn(LogCategory.PAGEVIEW, 'GA4 não inicializado para PageView');
      return false;
    }
    
    const pageParams = prepareEventParameters('page_view', params);
    return sendEvent('page_view', pageParams);
  }, [isInitialized]);

  // Rastrear evento genérico
  const trackEvent = useCallback(async (eventName, params = {}, options = {}) => {
    if (!isInitialized) {
      logger.warn(LogCategory.EVENT, `GA4 não inicializado para evento ${eventName}`);
      return false;
    }
    
    if (!eventName) {
      logger.error(LogCategory.EVENT, 'Nome do evento não fornecido');
      return false;
    }
    
    try {
      logger.info(LogCategory.EVENT, `Iniciando rastreamento de evento GA4: ${eventName}`, params);
      
      // Mapear eventos do Meta Pixel para GA4 se necessário
      let ga4EventName = eventName;
      if (options.mapFromMeta) {
        ga4EventName = mapMetaEventToGA4(eventName);
      }
      
      // Preparar parâmetros do evento (adiciona dados da página se necessário)
      const eventParams = prepareEventParameters(ga4EventName, params);
      
      // Enviar o evento
      return sendEvent(ga4EventName, eventParams, options);
    } catch (error) {
      logger.error(LogCategory.EVENT, `Erro ao rastrear evento GA4 ${eventName}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }, [isInitialized]);

  // Métodos para manipulação de dados do usuário
  const setGA4UserId = useCallback((userId) => {
    if (!isInitialized) {
      logger.warn(LogCategory.USER, 'GA4 não inicializado para definir User ID');
      return false;
    }
    
    setUserId(userId);
    return true;
  }, [isInitialized]);
  
  const getGA4UserId = useCallback(() => {
    return getUserId();
  }, []);
  
  const setGA4UserProperty = useCallback((propertyName, value) => {
    if (!isInitialized) {
      logger.warn(LogCategory.USER, 'GA4 não inicializado para definir User Property');
      return false;
    }
    
    setUserProperty(propertyName, value);
    return true;
  }, [isInitialized]);
  
  const setGA4UserProperties = useCallback((properties) => {
    if (!isInitialized) {
      logger.warn(LogCategory.USER, 'GA4 não inicializado para definir User Properties');
      return false;
    }
    
    setUserProperties(properties);
    return true;
  }, [isInitialized]);
  
  const getGA4UserProperties = useCallback(() => {
    return getUserProperties();
  }, []);
  
  const clearGA4UserData = useCallback(() => {
    if (!isInitialized) {
      logger.warn(LogCategory.USER, 'GA4 não inicializado para limpar dados do usuário');
      return false;
    }
    
    clearUserData();
    return true;
  }, [isInitialized]);

  return {
    isInitialized,
    initialize,
    trackPageView,
    trackEvent,
    // Novos métodos para dados do usuário
    setUserId: setGA4UserId,
    getUserId: getGA4UserId,
    setUserProperty: setGA4UserProperty,
    setUserProperties: setGA4UserProperties,
    getUserProperties: getGA4UserProperties,
    clearUserData: clearGA4UserData
  };
}

/**
 * Mapeia eventos do Meta Pixel para nomes de eventos equivalentes do GA4
 * @param {string} metaEventName - Nome do evento do Meta Pixel
 * @returns {string} Nome do evento equivalente no GA4
 */
function mapMetaEventToGA4(metaEventName) {
  // Mapeamento de eventos do Meta Pixel para GA4
  const eventMap = {
    // Eventos padrão
    'PageView': 'page_view',
    'ViewContent': 'view_item',
    'Lead': 'generate_lead',
    'Contact': 'contact',
    'SubmitApplication': 'begin_checkout',
    'CompleteRegistration': 'sign_up',
    
    // Adicione mais mapeamentos conforme necessário
    
    // Por padrão, converter camelCase para snake_case
    // Exemplo: 'AddToCart' -> 'add_to_cart'
  };
  
  // Retornar o evento mapeado ou converter para o formato GA4 (snake_case)
  return eventMap[metaEventName] || metaEventName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
} 