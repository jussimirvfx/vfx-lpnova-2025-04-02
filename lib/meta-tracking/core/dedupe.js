"use client";

import { logger, LogCategory } from './logger';

// Chave para armazenamento dos eventos
const STORAGE_KEY = '_vfx_meta_events';

// Tempo padrão de expiração (em horas)
const DEFAULT_EXPIRATION_HOURS = 24;

/**
 * Gera um ID único para um evento
 * @param {string} prefix - Prefixo opcional para o ID
 * @returns {string} ID gerado
 */
export function generateEventId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Gera um identificador para deduplicação com base no tipo de evento e seus parâmetros
 * @param {string} eventName - Nome do evento
 * @param {Object} params - Parâmetros do evento
 * @returns {string} Identificador para deduplicação
 */
export function generateDedupeKey(eventName, params = {}) {
  try {
    let identifier = 'default';

    // Customizar identificador com base no tipo de evento
    switch (eventName) {
      case 'ViewContent':
        // Usar content_name ou content_id como identificador
        identifier = params.content_name || params.content_id || params.page_path || 'default';
        break;

      case 'Contact':
        // Usar formulário ou página como identificador
        identifier = params.content_name || params.form_id || params.page_path || 'default';
        break;

      case 'Lead':
        // Para Lead usamos o email ou telefone (se disponíveis) para deduplicação
        identifier = params.email || params.phone || 'default';
        break;

      case 'Scroll':
        // Para scroll usamos threshold + URL
        identifier = `${params.depth_threshold || '0'}_${params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '')}`;
        break;

      default:
        // Para outros eventos, usar URL da página ou outro parâmetro relevante
        identifier = params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '') || 'default';
    }

    return `${eventName}_${identifier}`;
  } catch (error) {
    logger.error(LogCategory.DEDUPE, 'Erro ao criar identificador para evento', {
      error: error instanceof Error ? error.message : String(error),
      eventName
    });
    return `${eventName}_default`;
  }
}

/**
 * Verifica se um evento já foi enviado
 * @param {string} eventName - Nome do evento
 * @param {Object} params - Parâmetros do evento
 * @returns {boolean} Se o evento já foi enviado
 */
export function isEventDuplicate(eventName, params = {}) {
  if (typeof window === 'undefined') return false;
  
  try {
    const dedupeKey = generateDedupeKey(eventName, params);
    const eventKey = `${dedupeKey}`;
    
    // Obter eventos do localStorage
    const storedEvents = getStoredEvents();
    
    // Verificar se o evento existe
    if (storedEvents[eventKey]) {
      const eventTimestamp = storedEvents[eventKey];
      const now = Date.now();
      const maxAge = DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000; // horas para ms
      
      // Verificar se o evento expirou
      if (now - eventTimestamp > maxAge) {
        // Evento expirou, pode ser enviado novamente
        logger.debug(LogCategory.DEDUPE, 'Evento expirado, permitindo reenvio', {
          eventName,
          key: eventKey,
          age: (now - eventTimestamp) / 3600000, // em horas
          maxAge: DEFAULT_EXPIRATION_HOURS
        });
        return false;
      }
      
      // Evento não expirou, é duplicado
      logger.info(LogCategory.DEDUPE, 'Evento duplicado detectado e bloqueado', {
        eventName,
        key: eventKey,
        timestamp: eventTimestamp,
        age: (now - eventTimestamp) / 3600000 // em horas
      });
      return true;
    }
    
    // Evento não encontrado, não é duplicado
    return false;
  } catch (error) {
    logger.error(LogCategory.DEDUPE, 'Erro ao verificar duplicação de evento', {
      error: error instanceof Error ? error.message : String(error),
      eventName
    });
    
    // Em caso de erro, deixar passar
    return false;
  }
}

/**
 * Marca um evento como enviado para evitar duplicações
 * @param {string} eventName - Nome do evento
 * @param {Object} params - Parâmetros do evento
 */
export function markEventAsSent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const dedupeKey = generateDedupeKey(eventName, params);
    const eventKey = `${dedupeKey}`;
    
    // Obter eventos do localStorage
    const storedEvents = getStoredEvents();
    
    // Adicionar evento
    storedEvents[eventKey] = Date.now();
    
    // Limpar eventos antigos
    cleanupExpiredEvents(storedEvents);
    
    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedEvents));
    
    logger.debug(LogCategory.DEDUPE, 'Evento marcado como enviado', {
      eventName,
      key: eventKey,
      timestamp: storedEvents[eventKey]
    });
  } catch (error) {
    logger.error(LogCategory.DEDUPE, 'Erro ao marcar evento como enviado', {
      error: error instanceof Error ? error.message : String(error),
      eventName
    });
  }
}

/**
 * Obtém os eventos armazenados
 * @returns {Object} Eventos armazenados
 */
function getStoredEvents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.error(LogCategory.DEDUPE, 'Erro ao obter eventos armazenados', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {};
  }
}

/**
 * Remove eventos expirados
 * @param {Object} events - Eventos armazenados
 */
function cleanupExpiredEvents(events) {
  const now = Date.now();
  const maxAge = DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000; // horas para ms
  let cleanupCount = 0;
  
  // Remover eventos expirados
  Object.keys(events).forEach(key => {
    const timestamp = events[key];
    if (now - timestamp > maxAge) {
      delete events[key];
      cleanupCount++;
    }
  });
  
  if (cleanupCount > 0) {
    logger.debug(LogCategory.DEDUPE, `Removidos ${cleanupCount} eventos expirados`);
  }
} 