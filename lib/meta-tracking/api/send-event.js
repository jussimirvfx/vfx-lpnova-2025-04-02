"use client";

import { getConfig } from '../config';
import { logger, LogCategory } from '../core/logger';
import { generateEventId } from '../core/dedupe';
import { getFbp, getFbc, getExternalId, hashData } from '../core/hash-utils';

/**
 * Envia um evento para o Meta via Pixel e API de Conversões
 * @param {Object} event - Dados do evento
 * @returns {Promise<boolean>} - Sucesso do envio
 */
export async function sendEvent(event) {
  if (typeof window === 'undefined') return false;
  
  try {
    // Garantir que temos o ID do evento
    const eventId = event.event_id || generateEventId();
    const eventWithId = { ...event, event_id: eventId };
    
    // Enviar via Conversion API
    const apiPromise = sendConversionAPI(eventWithId)
      .catch(error => {
        logger.error(LogCategory.CONVERSION_API, 'Erro ao enviar evento via API', {
          error: error instanceof Error ? error.message : String(error),
          eventName: event.event_name,
          eventId
        });
        return false;
      });
    
    // Enviar via Pixel
    const pixelPromise = sendPixelEvent(eventWithId)
      .catch(error => {
        logger.error(LogCategory.PIXEL, 'Erro ao enviar evento via Pixel', {
          error: error instanceof Error ? error.message : String(error),
          eventName: event.event_name,
          eventId
        });
        return false;
      });
    
    // Aguardar ambos
    const [apiSuccess, pixelSuccess] = await Promise.all([apiPromise, pixelPromise]);
    
    logger.info(LogCategory.EVENT, `Evento ${event.event_name} processado`, {
      eventId,
      apiSuccess,
      pixelSuccess,
      success: apiSuccess || pixelSuccess
    });
    
    // Sucesso se pelo menos um dos envios funcionou
    return apiSuccess || pixelSuccess;
  } catch (error) {
    logger.error(LogCategory.EVENT, `Erro ao processar evento ${event.event_name}`, {
      error: error instanceof Error ? error.message : String(error),
      eventName: event.event_name
    });
    
    return false;
  }
}

/**
 * Envia evento via API de Conversões
 * @param {Object} event - Dados do evento
 * @param {number} retryCount - Contador de tentativas
 * @returns {Promise<boolean>} - Sucesso do envio
 */
async function sendConversionAPI(event, retryCount = 0) {
  if (typeof window === 'undefined') return false;

  // Configuração especial para evento PageView
  const isPageViewEvent = event.event_name === 'PageView';
  
  // Definir número máximo de tentativas
  const MAX_RETRIES = 2;
  
  // Log início da requisição
  logger.info(LogCategory.CONVERSION_API, `Iniciando envio para API: ${event.event_name}`, { 
    eventId: event.event_id,
    retry: retryCount
  });

  try {
    const startTime = performance.now();
    
    // Para PageView, esperar um pouco para garantir que os cookies sejam criados
    if (isPageViewEvent && retryCount === 0) {
      logger.debug(LogCategory.CONVERSION_API, 'Aguardando 1 segundo para garantir que cookies sejam criados', {
        eventName: event.event_name
      });
      
      // Esperar 1 segundo para cookies serem criados
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Extrair FBP e FBC para user_data
    const fbp = getFbp();
    const fbc = getFbc();
    
    // Obter external_id
    const externalId = getExternalId();
    
    // Cookies e URL para rastreamento
    logger.debug(LogCategory.CONVERSION_API, 'Cookies e URL para rastreamento', {
      fbp,
      fbc,
      externalId: externalId ? `${externalId.substring(0, 8)}...` : null,
      url: window.location.href
    });
    
    // Preparar dados do usuário
    const userData = {
      ...(event.user_data || {}),
      client_user_agent: navigator.userAgent,
      fbp,
      fbc
    };
    
    // Adicionar external_id se disponível
    if (externalId) {
      const hashedExternalId = hashData(externalId);
      console.log(`[EXTERNAL_ID] Adicionado ao evento da API: ${externalId} -> ${hashedExternalId.substring(0, 10)}...`);
      userData.external_id = hashedExternalId;
    }
    
    // Enviar a requisição para o endpoint da API
    const response = await fetch('/api/meta-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...event,
        user_data: userData,
        action_source: 'website',
        event_time: event.event_time || Math.floor(Date.now() / 1000),
        event_source_url: window.location.href,
      }),
    });
    
    // Verificar resposta
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(LogCategory.CONVERSION_API, `Erro na resposta da API: ${response.status}`, errorData);
      
      // Tentar novamente se não excedeu o limite
      if (retryCount < MAX_RETRIES) {
        logger.info(LogCategory.CONVERSION_API, `Tentando novamente (${retryCount + 1}/${MAX_RETRIES})...`);
        return sendConversionAPI(event, retryCount + 1);
      }
      
      return false;
    }
    
    // Resposta ok
    const data = await response.json();
    const endTime = performance.now();
    
    logger.info(LogCategory.CONVERSION_API, `Evento enviado com sucesso via API: ${event.event_name}`, {
      eventId: event.event_id,
      duration: endTime - startTime,
      data
    });
    
    return true;
  } catch (error) {
    logger.error(LogCategory.CONVERSION_API, `Erro ao enviar evento via API: ${event.event_name}`, {
      error: error instanceof Error ? error.message : String(error),
      eventId: event.event_id
    });
    
    // Tentar novamente se não excedeu o limite
    if (retryCount < MAX_RETRIES) {
      logger.info(LogCategory.CONVERSION_API, `Tentando novamente (${retryCount + 1}/${MAX_RETRIES})...`);
      return sendConversionAPI(event, retryCount + 1);
    }
    
    return false;
  }
}

/**
 * Envia evento via Pixel
 * @param {Object} event - Dados do evento
 * @returns {Promise<boolean>} - Sucesso do envio
 */
async function sendPixelEvent(event) {
  if (typeof window === 'undefined' || !window.fbq) return false;
  
  try {
    const { event_name, event_id, custom_data, user_data } = event;
    
    // Obter external_id
    const externalId = getExternalId();
    
    // Dados para o evento
    const eventData = {
      eventID: event_id,
      ...(custom_data || {})
    };
    
    // Adicionar external_id se disponível
    if (externalId) {
      const hashedExternalId = hashData(externalId);
      console.log(`[EXTERNAL_ID] Adicionado ao evento ${event_name} do Pixel: ${externalId} -> ${hashedExternalId.substring(0, 10)}...`);
      eventData.external_id = hashedExternalId;
    }
    
    // Enviar o evento
    window.fbq('track', event_name, eventData, { eventID: event_id });
    
    logger.info(LogCategory.PIXEL, `Evento enviado com sucesso via Pixel: ${event_name}`, {
      eventId: event_id,
      method: 'track'
    });
    
    return true;
  } catch (error) {
    logger.error(LogCategory.PIXEL, `Erro ao enviar evento via Pixel: ${event.event_name}`, {
      error: error instanceof Error ? error.message : String(error),
      eventId: event.event_id
    });
    return false;
  }
} 