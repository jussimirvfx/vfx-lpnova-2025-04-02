/**
 * Sistema de logs para rastreamento de eventos Meta Pixel
 * Fornece logs detalhados com timestamps, categorias e níveis
 */

// Níveis de log disponíveis
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Categorias de log para diferentes componentes
export enum LogCategory {
  META_PIXEL = 'Meta Pixel',
  CONVERSION_API = 'Conversion API',
  PAGE_VIEW = 'PageView',
  SCROLL = 'Scroll',
  LEAD = 'Lead',
  CONTACT = 'Contact',
  VIEW_CONTENT = 'ViewContent',
  INIT = 'Initialization',
  GENERAL = 'General'
}

// Controle de armazenamento de logs
const MAX_LOGS = 1000;
export const eventLogs: Array<LogEntry> = [];

// Interface para entrada de log
export interface LogEntry {
  timestamp: number;
  formattedTime: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

// Cache para evitar log duplicados num curto período
const recentLogCache = new Map<string, number>();
const CACHE_EXPIRY_MS = 200; // 200ms

/**
 * Adiciona uma entrada ao registro de logs
 */
export function addLogEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: any
): void {
  try {
    const now = Date.now();
    
    // Deduplica logs muito similares em sequência
    const cacheKey = `${level}:${category}:${message}:${JSON.stringify(data || {})}`;
    const lastLogTime = recentLogCache.get(cacheKey);
    
    if (lastLogTime && now - lastLogTime < CACHE_EXPIRY_MS) {
      return; // Ignora logs duplicados em sequência
    }
    
    recentLogCache.set(cacheKey, now);
    
    // Formata a hora para visualização
    const formattedTime = new Date(now).toISOString();
    
    // Cria entrada de log
    const logEntry: LogEntry = {
      timestamp: now,
      formattedTime,
      level,
      category,
      message,
      data
    };
    
    // Adiciona ao array de logs (mantendo o limite)
    eventLogs.unshift(logEntry);
    if (eventLogs.length > MAX_LOGS) {
      eventLogs.pop();
    }
    
    // Imprime no console com formatação apropriada
    const prefix = `[${formattedTime.split('T')[1].split('.')[0]}] [${category}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.debug(prefix, message, data || '');
        }
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data || '');
        break;
    }
  } catch (error) {
    // Fallback seguro se algo der errado com o log
    console.error('Erro no sistema de logs:', error);
  }
}

/**
 * Funções de conveniência para diferentes níveis de log
 */
export const logger = {
  debug: (category: LogCategory, message: string, data?: any) => 
    addLogEntry(LogLevel.DEBUG, category, message, data),
  
  info: (category: LogCategory, message: string, data?: any) => 
    addLogEntry(LogLevel.INFO, category, message, data),
  
  warn: (category: LogCategory, message: string, data?: any) => 
    addLogEntry(LogLevel.WARN, category, message, data),
  
  error: (category: LogCategory, message: string, data?: any) => 
    addLogEntry(LogLevel.ERROR, category, message, data),
    
  // Log específico para eventos Meta Pixel
  pixelEvent: (eventName: string, status: string, eventId: string, data?: any) => {
    const category = eventName === 'PageView' 
      ? LogCategory.PAGE_VIEW 
      : LogCategory.META_PIXEL;
      
    addLogEntry(
      LogLevel.INFO, 
      category, 
      `Evento ${eventName} ${status}`, 
      { eventId, ...data }
    );
  },
  
  // Retorna todos os logs para inspeção
  getAllLogs: () => [...eventLogs],
  
  // Retorna logs filtrados por categoria
  getLogsByCategory: (category: LogCategory) => 
    eventLogs.filter(log => log.category === category),
    
  // Limpa todos os logs
  clearLogs: () => {
    eventLogs.length = 0;
  }
};

// Expor globalmente para depuração no console
if (typeof window !== 'undefined') {
  // @ts-ignore
  window._metaPixelLogs = {
    getLogs: () => [...eventLogs],
    getLogsByCategory: (category: LogCategory) => 
      eventLogs.filter(log => log.category === category),
    clear: () => { eventLogs.length = 0; }
  };
}

export default logger; 