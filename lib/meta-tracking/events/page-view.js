"use client";

import { logger, LogCategory } from '../core/logger';
import { collectPageData, collectUserData } from '../core/data-collector';
import { generateEventId } from '../core/dedupe';
import { sendEvent } from '../api/send-event';
import { isEventDuplicate, markEventAsSent } from '../core/dedupe';

/**
 * Rastreia evento de visualização de página
 * @param {Object} options - Opções adicionais para o evento
 * @returns {Promise<boolean>} - Sucesso do rastreamento
 */
export async function trackPageView(options = {}) {
  if (typeof window === 'undefined') return false;
  
  logger.info(LogCategory.PAGEVIEW, 'Iniciando rastreamento de PageView', { 
    url: window.location.href,
    title: document.title,
    timestamp: Date.now()
  });

  try {
    // Preparar evento
    const eventId = options.eventId || generateEventId();
    const eventTime = Math.floor(Date.now() / 1000);
    
    // Coletar dados da página
    const pageData = collectPageData();
    
    // Coletar dados do usuário
    const userData = collectUserData(options.userData || {});
    
    // Preparar evento completo
    const event = {
      event_name: 'PageView',
      event_id: eventId,
      event_time: eventTime,
      custom_data: pageData,
      user_data: userData
    };
    
    logger.debug(LogCategory.PAGEVIEW, 'Evento PageView preparado', { eventId });
    
    // Enviar o evento
    const success = await sendEvent(event);
    
    if (success) {
      logger.info(LogCategory.PAGEVIEW, 'PageView processado com sucesso', { 
        eventId,
        url: window.location.pathname 
      });
    }
    
    return success;
  } catch (error) {
    logger.error(LogCategory.PAGEVIEW, 'Erro ao processar PageView', {
      error: error instanceof Error ? error.message : String(error),
      url: window.location.href
    });
    
    return false;
  }
} 