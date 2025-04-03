/**
 * Sistema de prevenção de eventos duplicados por usuário
 * Conforme checklist item 13: sistema anti-duplicação
 */

// Configuração de expiração
const EVENT_EXPIRATION = {
  Lead: 24 * 60 * 60 * 1000,       // 24 horas em ms
  Contact: 1 * 60 * 60 * 1000,      // 1 hora em ms
  ViewContent: 30 * 60 * 1000,      // 30 minutos em ms
  Scroll: 15 * 60 * 1000,           // 15 minutos em ms
  PageView: 5 * 60 * 1000,          // 5 minutos em ms
  default: 6 * 60 * 60 * 1000       // 6 horas em ms (padrão)
};

// Chave para o localStorage
const STORAGE_KEY = '_meta_events_sent';

// Interface para os eventos armazenados
interface StoredEvent {
  eventName: string;
  identifier: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Obter lista de eventos armazenados
 */
function getStoredEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('[Event Deduplication] Erro ao obter eventos armazenados:', error);
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedEvents));
  } catch (error) {
    console.error('[Event Deduplication] Erro ao armazenar evento:', error);
  }
}

/**
 * Limpar eventos expirados da lista
 */
function cleanExpiredEvents(events: StoredEvent[]): StoredEvent[] {
  const now = Date.now();
  
  return events.filter(event => {
    const expirationTime = EVENT_EXPIRATION[event.eventName as keyof typeof EVENT_EXPIRATION] || EVENT_EXPIRATION.default;
    const isExpired = (now - event.timestamp) > expirationTime;
    
    // Manter apenas eventos não expirados
    return !isExpired;
  });
}

/**
 * Verificar se um evento foi enviado recentemente
 * Usado para evitar duplicação de eventos por usuário
 * 
 * @param eventName Nome do evento (ex: 'Lead', 'Contact')
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
      const expirationTime = EVENT_EXPIRATION[eventName as keyof typeof EVENT_EXPIRATION] || EVENT_EXPIRATION.default;
      const isExpired = (now - event.timestamp) > expirationTime;
      
      return !isExpired;
    });
    
    return !!matchingEvent;
  } catch (error) {
    console.error('[Event Deduplication] Erro ao verificar evento:', error);
    return false; // Em caso de erro, permitir o evento (falso negativo é melhor que falso positivo)
  }
}

/**
 * Marcar evento como enviado para evitar duplicações
 * 
 * @param eventName Nome do evento (ex: 'Lead', 'Contact')
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
  console.log(`[Event Deduplication] Evento ${eventName} marcado como enviado para ${identifier}`);
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
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Event Deduplication] Todos os eventos foram limpos');
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
    console.log(`[Event Deduplication] Eventos foram limpos: ${eventName || 'todos'}`);
  } catch (error) {
    console.error('[Event Deduplication] Erro ao limpar eventos:', error);
  }
}

/**
 * Obter todos os eventos armazenados (para debugging)
 */
export function getAllStoredEvents(): StoredEvent[] {
  return cleanExpiredEvents(getStoredEvents());
} 