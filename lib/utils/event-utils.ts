"use client";

/**
 * Gera um ID único para eventos
 * Útil para deduplicação e rastreamento de eventos entre sistemas
 * Formato UUID v4
 */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback para browsers mais antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Cria uma chave para deduplicação baseada no nome do evento e seus parâmetros
 */
export function generateDedupeKey(eventName: string, params?: Record<string, any>): string {
  // Lista de parâmetros que não devem ser incluídos na chave de deduplicação
  const excludedParams = ['timestamp', 'event_id', 'client_id', 'user_id', 'session_id'];
  
  // Filtra os parâmetros para remover os excluídos e valores não determinísticos
  let dedupParams = {};
  if (params) {
    dedupParams = Object.entries(params)
      .filter(([key]) => !excludedParams.includes(key))
      .reduce((acc, [key, value]) => {
        // Ignorar funções, objetos complexos, etc.
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
  }
  
  // Criar string de parâmetros ordenada para garantir consistência
  const paramsStr = Object.entries(dedupParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${eventName}${paramsStr ? `|${paramsStr}` : ''}`;
}

/**
 * Verifica se um evento com a mesma chave de deduplicação já foi enviado
 */
export function isEventDuplicate(eventName: string, params?: Record<string, any>, maxAgeHours = 24): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  
  try {
    const key = generateDedupeKey(eventName, params);
    const dedupeKey = `event_dedupe_${key}`;
    
    // Verificar se existe no localStorage
    const storedValue = localStorage.getItem(dedupeKey);
    if (!storedValue) return false;
    
    // Verificar se não expirou
    const timestamp = parseInt(storedValue, 10);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    return !isNaN(timestamp) && (now - timestamp) < maxAgeMs;
  } catch (e) {
    // Em caso de erro, assumir que não é duplicado
    console.error('Erro ao verificar duplicação de evento:', e);
    return false;
  }
}

/**
 * Marca um evento como enviado no localStorage para deduplicação
 */
export function markEventAsSent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    const key = generateDedupeKey(eventName, params);
    const dedupeKey = `event_dedupe_${key}`;
    localStorage.setItem(dedupeKey, Date.now().toString());
  } catch (e) {
    console.error('Erro ao marcar evento como enviado:', e);
  }
} 