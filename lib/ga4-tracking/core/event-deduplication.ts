/**
 * Sistema de prevenção de eventos duplicados por usuário para GA4
 * Conforme checklist item 14: sistema anti-duplicação específico para GA4
 */

import { GA4_CONFIG } from "../config/ga4-config";

// Interface para os eventos armazenados
interface StoredEvent {
  eventName: string;
  identifier: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Obter lista de eventos armazenados do GA4
 */
function getStoredEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedData = localStorage.getItem(GA4_CONFIG.STORAGE_NAMESPACE);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao obter eventos armazenados:`, error);
    return [];
  }
}

/**
 * Adicionar evento à lista de eventos armazenados
 */
function storeEvent(event: StoredEvent): void {
  if (typeof window === 'undefined') return;
  
  try {
    const events = getStoredEvents();
    events.push(event);
    
    // Limpar eventos expirados antes de salvar
    const cleanedEvents = cleanExpiredEvents(events);
    
    localStorage.setItem(GA4_CONFIG.STORAGE_NAMESPACE, JSON.stringify(cleanedEvents));
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao armazenar evento:`, error);
  }
}

/**
 * Limpar eventos expirados da lista
 */
function cleanExpiredEvents(events: StoredEvent[]): StoredEvent[] {
  const now = Date.now();
  
  return events.filter(event => {
    const expirationTime = 
      GA4_CONFIG.EVENT_EXPIRATION[event.eventName as keyof typeof GA4_CONFIG.EVENT_EXPIRATION] || 
      GA4_CONFIG.EVENT_EXPIRATION.default;
    
    const isExpired = (now - event.timestamp) > expirationTime;
    
    // Manter apenas eventos não expirados
    return !isExpired;
  });
}

/**
 * Verificar se um evento foi enviado recentemente
 * Usado para evitar duplicação de eventos por usuário
 * 
 * @param eventName Nome do evento (ex: 'page_view', 'generate_lead')
 * @param identifier Identificador único para o evento (ex: conteúdo específico, id do formulário)
 * @returns Booleano indicando se o evento já foi enviado recentemente
 */
export function isEventAlreadySent(eventName: string, identifier: string = 'default'): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const events = getStoredEvents();
    const now = Date.now();
    
    // Procurar por evento não expirado com o mesmo nome e identificador
    const matchingEvent = events.find(event => {
      // Verificar se é o mesmo evento e identificador
      const isSameEvent = event.eventName === eventName && event.identifier === identifier;
      
      if (!isSameEvent) return false;
      
      // Verificar se não expirou
      const expirationTime = 
        GA4_CONFIG.EVENT_EXPIRATION[eventName as keyof typeof GA4_CONFIG.EVENT_EXPIRATION] || 
        GA4_CONFIG.EVENT_EXPIRATION.default;
      
      const isExpired = (now - event.timestamp) > expirationTime;
      
      return !isExpired;
    });
    
    return !!matchingEvent;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao verificar evento:`, error);
    return false; // Em caso de erro, permitir o evento
  }
}

/**
 * Marcar evento como enviado para evitar duplicações
 * 
 * @param eventName Nome do evento (ex: 'page_view', 'generate_lead')
 * @param identifier Identificador único para o evento (ex: conteúdo específico, id do formulário)
 * @param metadata Dados adicionais opcionais para armazenar com o evento
 */
export function markEventAsSent(
  eventName: string, 
  identifier: string = 'default',
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;
  
  const event: StoredEvent = {
    eventName,
    identifier,
    timestamp: Date.now(),
    metadata
  };
  
  storeEvent(event);
  
  if (GA4_CONFIG.LOGGING.ENABLED) {
    console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Evento ${eventName} marcado como enviado para ${identifier}`);
  }
}

/**
 * Limpar histórico de eventos específicos ou todos os eventos
 * 
 * @param eventName Nome do evento para limpar (se undefined, limpa todos)
 * @param identifier Identificador específico (se undefined, limpa todos do tipo do evento)
 */
export function clearSentEvents(eventName?: string, identifier?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Se nenhum parâmetro for fornecido, limpar tudo
    if (!eventName && !identifier) {
      localStorage.removeItem(GA4_CONFIG.STORAGE_NAMESPACE);
      
      if (GA4_CONFIG.LOGGING.ENABLED) {
        console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Todos os eventos foram limpos`);
      }
      
      return;
    }
    
    const events = getStoredEvents();
    
    // Filtrar eventos a manter
    const filteredEvents = events.filter(event => {
      // Se eventName foi fornecido e é diferente, manter
      if (eventName && event.eventName !== eventName) return true;
      
      // Se identifier foi fornecido e é diferente, manter
      if (identifier && event.identifier !== identifier) return true;
      
      // Caso contrário, excluir
      return false;
    });
    
    localStorage.setItem(GA4_CONFIG.STORAGE_NAMESPACE, JSON.stringify(filteredEvents));
    
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Eventos foram limpos: ${eventName || 'todos'}`);
    }
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao limpar eventos:`, error);
  }
}

/**
 * Obter todos os eventos armazenados (para debugging)
 */
export function getAllStoredEvents(): StoredEvent[] {
  return cleanExpiredEvents(getStoredEvents());
} 