/**
 * Sistema de fila para eventos GA4 pendentes
 * Permite que eventos sejam enfileirados quando o gtag ainda não está disponível
 * e processados posteriormente quando o gtag estiver carregado
 */

type QueuedEvent = {
  eventName: string;
  params: any;
  uniqueIdentifier?: string;
};

// Fila de eventos pendentes
let pendingEvents: QueuedEvent[] = [];

// Flag para verificar se o processador de fila já foi inicializado
let queueProcessorInitialized = false;

/**
 * Adiciona um evento à fila de eventos pendentes
 */
export function queueEvent(eventName: string, params: any, uniqueIdentifier?: string): void {
  pendingEvents.push({ eventName, params, uniqueIdentifier });
  console.log(`[GA4 Queue] Evento "${eventName}" adicionado à fila. Total na fila: ${pendingEvents.length}`);
  
  // Inicializar o processador de fila se ainda não foi feito
  if (!queueProcessorInitialized) {
    initQueueProcessor();
  }
}

/**
 * Verifica se o gtag está disponível
 */
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
}

/**
 * Processa a fila de eventos pendentes
 */
function processQueue(): void {
  if (!isGtagAvailable()) {
    return; // Não processa se o gtag ainda não estiver disponível
  }

  // Copia a fila atual e limpa a fila original
  const eventsToProcess = [...pendingEvents];
  pendingEvents = [];

  if (eventsToProcess.length === 0) {
    return; // Não há eventos para processar
  }

  console.log(`[GA4 Queue] Processando ${eventsToProcess.length} eventos pendentes`);
  
  // Processa cada evento
  eventsToProcess.forEach(({ eventName, params, uniqueIdentifier }) => {
    try {
      console.log(`[GA4 Queue] Enviando evento "${eventName}" da fila`);
      (window as any).gtag('event', eventName, params);
    } catch (error) {
      console.error(`[GA4 Queue] Erro ao enviar evento "${eventName}" da fila:`, error);
      // Re-adicionar à fila em caso de erro?
      // pendingEvents.push({ eventName, params, uniqueIdentifier });
    }
  });
}

/**
 * Inicializa o processador de fila
 * - Tenta processar imediatamente se o gtag já estiver disponível
 * - Configura um observer para processar quando o gtag estiver disponível
 * - Configura um intervalo para tentar periodicamente
 */
function initQueueProcessor(): void {
  queueProcessorInitialized = true;

  // Tentar processar imediatamente
  processQueue();

  // Observar a disponibilidade do gtag (usando MutationObserver)
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    // Observer para detectar quando o script do GA4 é adicionado
    const observer = new MutationObserver(() => {
      if (isGtagAvailable()) {
        processQueue();
      }
    });
    
    // Observar mudanças no head (onde o script é normalmente adicionado)
    observer.observe(document.head || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Configurar intervalo para tentar periodicamente (como backup)
  const interval = setInterval(() => {
    if (isGtagAvailable()) {
      processQueue();
      if (pendingEvents.length === 0) {
        clearInterval(interval);
      }
    }
  }, 1000);

  // Limpar intervalo após 30 segundos para não ficar rodando indefinidamente
  setTimeout(() => clearInterval(interval), 30000);
}

/**
 * Retorna o número de eventos pendentes na fila
 */
export function getPendingEventsCount(): number {
  return pendingEvents.length;
} 