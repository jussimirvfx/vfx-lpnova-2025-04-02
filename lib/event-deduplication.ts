/**
 * Sistema de prevenção de eventos duplicados por usuário
 * Compatível com eventos GA4 e Meta, usando namespaces separados
 */

// Configuração de expiração (mesma para Meta e GA4)
const EVENT_EXPIRATION = {
  // Meta/Facebook events
  Lead: 24 * 60 * 60 * 1000,       // 24 horas em ms
  Contact: 1 * 60 * 60 * 1000,      // 1 hora em ms
  ViewContent: 30 * 60 * 1000,      // 30 minutos em ms
  SubmitApplication: 24 * 60 * 60 * 1000, // 24 horas em ms
  Scroll: 15 * 60 * 1000,           // 15 minutos em ms
  PageView: 5 * 60 * 1000,          // 5 minutos em ms
  VideoPlay: 10 * 60 * 1000,        // 10 minutos em ms
  
  // GA4 events - usar os mesmos tempos de expiração dos eventos Meta equivalentes
  Whatsapp: 1 * 60 * 60 * 1000,  // 1 hora (como Contact)
  VerApresentacao: 30 * 60 * 60 * 1000,  // 30 minutos (como ViewContent) - antes era view_item
  QualifiedLead: 24 * 60 * 60 * 1000,  // 24 horas (como SubmitApplication)
  scroll: 15 * 60 * 1000,                 // 15 minutos (como Scroll)
  page_view: 5 * 60 * 1000,               // 5 minutos (como PageView)
  video_progress: 10 * 60 * 1000,         // 10 minutos (como VideoPlay)
  video_start: 10 * 60 * 1000,            // 10 minutos
  video_complete: 10 * 60 * 1000,         // 10 minutos
  
  default: 6 * 60 * 60 * 1000       // 6 horas em ms (padrão)
};

// Chaves para o localStorage por namespace
const STORAGE_KEYS = {
  META: '_meta_events_sent',
  GA4: '_ga4_events_sent',
  DEFAULT: '_analytics_events_sent'
};

// Interface para os eventos armazenados
interface StoredEvent {
  eventName: string;
  identifier: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Tipos de namespace suportados
type NamespaceType = 'META' | 'GA4' | 'DEFAULT';

/**
 * Determina o namespace com base no nome do evento
 */
function getNamespaceByEventName(eventName: string): NamespaceType {
  // Eventos GA4 padrão e custom
  const ga4Events = [
    'page_view', 'scroll', 'VerApresentacao', 'Lead', 'QualifiedLead', 
    'Whatsapp', 'video_start', 'video_progress', 'video_complete'
  ];
  
  // Eventos Meta/Facebook padrão
  const metaEvents = [
    'PageView', 'Scroll', 'ViewContent', 'Lead', 'SubmitApplication', 
    'Contact', 'VideoPlay', 'CompleteRegistration'
  ];
  
  if (ga4Events.includes(eventName)) return 'GA4';
  if (metaEvents.includes(eventName)) return 'META';
  
  return 'DEFAULT';
}

/**
 * Obter lista de eventos armazenados para um namespace específico
 */
function getStoredEvents(namespace: NamespaceType = 'DEFAULT'): StoredEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const storageKey = STORAGE_KEYS[namespace];
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return [];
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error(`[Event Deduplication] Erro ao obter eventos ${namespace}:`, error);
    return [];
  }
}

/**
 * Adicionar evento à lista de eventos armazenados
 */
function storeEvent(event: StoredEvent, namespace: NamespaceType = 'DEFAULT'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const events = getStoredEvents(namespace);
    events.push(event);
    
    // Limpar eventos expirados antes de salvar
    const cleanedEvents = cleanExpiredEvents(events);
    
    const storageKey = STORAGE_KEYS[namespace];
    localStorage.setItem(storageKey, JSON.stringify(cleanedEvents));
  } catch (error) {
    console.error(`[Event Deduplication] Erro ao armazenar evento ${namespace}:`, error);
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
 * @param forceNamespace (opcional) Força um namespace específico (útil para integração)
 * @returns Booleano indicando se o evento já foi enviado recentemente
 */
export function isEventAlreadySent(
  eventName: string, 
  identifier: string = 'default',
  forceNamespace?: NamespaceType
): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Determinar o namespace (automático ou forçado)
    const namespace = forceNamespace || getNamespaceByEventName(eventName);
    const events = getStoredEvents(namespace);
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
 * @param forceNamespace (opcional) Força um namespace específico (útil para integração)
 */
export function markEventAsSent(
  eventName: string, 
  identifier: string = 'default',
  metadata?: Record<string, any>,
  forceNamespace?: NamespaceType
): void {
  if (typeof window === 'undefined') return;
  
  // Determinar o namespace (automático ou forçado)
  const namespace = forceNamespace || getNamespaceByEventName(eventName);
  
  const event: StoredEvent = {
    eventName,
    identifier,
    timestamp: Date.now(),
    metadata
  };
  
  storeEvent(event, namespace);
  console.log(`[Event Deduplication] Evento ${eventName} marcado como enviado para ${identifier} no namespace ${namespace}`);
}

/**
 * Limpar histórico de eventos específicos ou todos os eventos
 * 
 * @param namespace Namespace para limpar (se undefined, limpa todos)
 * @param eventName Nome do evento para limpar (se undefined, limpa todos do namespace)
 * @param identifier Identificador específico (se undefined, limpa todos do tipo do evento)
 */
export function clearSentEvents(
  namespace?: NamespaceType,
  eventName?: string, 
  identifier?: string
): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Se apenas namespace for fornecido, limpar todo o namespace
    if (namespace && !eventName && !identifier) {
      localStorage.removeItem(STORAGE_KEYS[namespace]);
      console.log(`[Event Deduplication] Todos os eventos do namespace ${namespace} foram limpos`);
      return;
    }
    
    // Se nenhum parâmetro for fornecido, limpar todos os namespaces
    if (!namespace && !eventName && !identifier) {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      console.log('[Event Deduplication] Todos os eventos de todos os namespaces foram limpos');
      return;
    }
    
    // Se o namespace não for fornecido mas o eventName sim, usar namespace automático
    const actualNamespace = namespace || (eventName ? getNamespaceByEventName(eventName) : 'DEFAULT');
    const events = getStoredEvents(actualNamespace);
    
    // Filtrar eventos a manter
    const filteredEvents = events.filter(event => {
      // Se eventName foi fornecido e é diferente, manter
      if (eventName && event.eventName !== eventName) return true;
      
      // Se identifier foi fornecido e é diferente, manter
      if (identifier && event.identifier !== identifier) return true;
      
      // Caso contrário, excluir
      return false;
    });
    
    localStorage.setItem(STORAGE_KEYS[actualNamespace], JSON.stringify(filteredEvents));
    console.log(`[Event Deduplication] Eventos foram limpos: ${eventName || 'todos'} do namespace ${actualNamespace}`);
  } catch (error) {
    console.error('[Event Deduplication] Erro ao limpar eventos:', error);
  }
}

/**
 * Obter todos os eventos armazenados (para debugging)
 */
export function getAllStoredEvents(namespace?: NamespaceType): Record<NamespaceType, StoredEvent[]> {
  if (namespace) {
    return {
      [namespace]: cleanExpiredEvents(getStoredEvents(namespace))
    } as Record<NamespaceType, StoredEvent[]>;
  }
  
  return {
    META: cleanExpiredEvents(getStoredEvents('META')),
    GA4: cleanExpiredEvents(getStoredEvents('GA4')),
    DEFAULT: cleanExpiredEvents(getStoredEvents('DEFAULT'))
  };
} 