"use client";

import { logger, LogCategory } from '../core/logger';
import { getConfig } from '../config';
import { getUserId, prepareUserPropertiesForMP } from '../core/user-data';

// Contadores para diagnóstico
let gtagEventsCounter = 0;
let mpEventsCounter = 0;

/**
 * Envia um evento para o GA4 (browser e/ou Measurement Protocol)
 * @param {string} eventName - Nome do evento a ser enviado
 * @param {Object} eventParams - Parâmetros do evento
 * @param {Object} options - Opções adicionais
 * @returns {Promise<boolean>} Sucesso do envio
 */
export async function sendEvent(eventName, eventParams = {}, options = {}) {
  if (typeof window === 'undefined') {
    logger.warn(LogCategory.EVENT, 'Tentativa de envio de evento fora do cliente', { eventName });
    return false;
  }
  
  try {
    // Preparar opções
    const useGtag = options.useGtag !== false;
    const useMeasurementProtocol = options.useMeasurementProtocol !== false;
    
    logger.info(LogCategory.EVENT, `Iniciando envio de evento ${eventName}`, {
      params: eventParams,
      gtag: useGtag,
      measurementProtocol: useMeasurementProtocol
    });
    
    // Adicionar o valor do contador ao log
    if (process.env.NODE_ENV === 'development') {
      console.info(`[GA4] Enviando evento: ${eventName}`, { 
        gtagEvents: gtagEventsCounter, 
        mpEvents: mpEventsCounter 
      });
    }
    
    // Enviar usando gtag (browser)
    let gtagSuccess = false;
    if (useGtag) {
      gtagSuccess = sendGtagEvent(eventName, eventParams);
      if (gtagSuccess) gtagEventsCounter++;
    }
    
    // Enviar usando Measurement Protocol (server-side)
    let mpSuccess = false;
    if (useMeasurementProtocol) {
      mpSuccess = await sendMeasurementProtocolEvent(eventName, eventParams);
      if (mpSuccess) mpEventsCounter++;
    }
    
    const success = gtagSuccess || mpSuccess;
    
    if (success) {
      logger.info(LogCategory.EVENT, `Evento ${eventName} enviado com sucesso`, { 
        gtag: gtagSuccess, 
        measurementProtocol: mpSuccess 
      });
    } else {
      logger.warn(LogCategory.EVENT, `Falha ao enviar evento ${eventName}`, { 
        gtag: gtagSuccess, 
        measurementProtocol: mpSuccess 
      });
    }
    
    return success;
  } catch (error) {
    logger.error(LogCategory.EVENT, `Erro ao enviar evento ${eventName}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return false;
  }
}

/**
 * Envia um evento usando gtag (browser)
 * @param {string} eventName - Nome do evento
 * @param {Object} eventParams - Parâmetros do evento
 * @returns {boolean} Sucesso do envio
 */
function sendGtagEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Verificar a existência do gtag
  if (typeof window.gtag !== 'function') {
    // Verificar se o GA4 está disponível na página
    const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    
    if (!gaScript) {
      logger.warn(LogCategory.EVENT, 'Script do GA4 não encontrado no DOM, gtag não disponível', { eventName });
    } else {
      logger.warn(LogCategory.EVENT, 'Script do GA4 encontrado, mas função gtag não está disponível', { 
        eventName,
        scriptSrc: gaScript.src
      });
    }
    
    return false;
  }
  
  try {
    // Enviar evento usando gtag
    window.gtag('event', eventName, eventParams);
    
    logger.debug(LogCategory.EVENT, `Evento ${eventName} enviado via gtag`, { 
      params: eventParams,
      count: gtagEventsCounter + 1
    });
    
    // Em desenvolvimento, mostrar também no console
    if (process.env.NODE_ENV === 'development') {
      console.info(`[GA4 gtag] Evento enviado: ${eventName}`, eventParams);
    }
    
    return true;
  } catch (error) {
    logger.error(LogCategory.EVENT, `Erro ao enviar evento via gtag`, {
      error: error instanceof Error ? error.message : String(error),
      eventName
    });
    return false;
  }
}

/**
 * Envia um evento usando o Measurement Protocol (via API interna)
 * @param {string} eventName - Nome do evento
 * @param {Object} eventParams - Parâmetros do evento
 * @returns {Promise<boolean>} Sucesso do envio
 */
async function sendMeasurementProtocolEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined') return false;
  
  try {
    const config = getConfig();
    
    if (!config.MEASUREMENT_ID) {
      logger.warn(LogCategory.EVENT, 'GA4 Measurement ID não configurado para Measurement Protocol');
      return false;
    }
    
    // Obter client_id ou usar o fornecido
    const clientId = eventParams.client_id || getClientIdForMP();
    
    // Obter user_id (se disponível)
    const userId = getUserId();
    
    // Preparar dados para o Measurement Protocol
    const measurementData = {
      eventName,
      params: eventParams,
      clientId
    };
    
    // Adicionar user_id se disponível
    if (userId) {
      measurementData.userId = userId;
    }
    
    // Adicionar user_properties se disponíveis
    const userProperties = prepareUserPropertiesForMP();
    if (userProperties) {
      measurementData.userProperties = userProperties;
    }
    
    // Em desenvolvimento, mostrar no console
    if (process.env.NODE_ENV === 'development') {
      console.info(`[GA4 MP] Enviando via Measurement Protocol: ${eventName}`, measurementData);
    }
    
    // Enviar para a rota da API interna do Next.js
    const response = await fetch('/api/ga4-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(measurementData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(LogCategory.EVENT, `Falha ao enviar evento para API de Measurement Protocol`, {
        status: response.status,
        error: errorText,
        eventName
      });
      return false;
    }
    
    // Tentar obter a resposta como JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { success: response.ok };
    }
    
    logger.debug(LogCategory.EVENT, `Evento ${eventName} enviado via Measurement Protocol`, { 
      params: eventParams,
      hasUserId: !!userId,
      hasUserProperties: !!userProperties,
      response: responseData,
      count: mpEventsCounter + 1
    });
    
    return true;
  } catch (error) {
    logger.error(LogCategory.EVENT, `Erro ao enviar evento via Measurement Protocol`, {
      error: error instanceof Error ? error.message : String(error),
      eventName
    });
    
    return false;
  }
}

/**
 * Obtém ou gera um client_id para o Measurement Protocol
 * @returns {string} Client ID
 */
function getClientIdForMP() {
  if (typeof window === 'undefined') return '';
  
  // Tentar obter o client_id do cookie _ga existente
  const match = document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Tentar obter do localStorage
  try {
    const storedClientId = localStorage.getItem('ga_client_id');
    if (storedClientId) {
      return storedClientId;
    }
  } catch (e) {
    // Ignorar erros de localStorage (pode estar desativado)
  }
  
  // Gerar um novo client_id se não existir
  const newClientId = `${Math.floor(Math.random() * 1000000000)}.${Date.now()}`;
  
  // Salvar no localStorage para consistência
  try {
    localStorage.setItem('ga_client_id', newClientId);
  } catch (e) {
    // Ignorar erros de localStorage
  }
  
  return newClientId;
} 