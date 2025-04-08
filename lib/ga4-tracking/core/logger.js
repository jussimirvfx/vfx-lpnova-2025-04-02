"use client";

// Níveis de log
export const LogLevel = Object.freeze({
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
});

// Categorias de log
export const LogCategory = Object.freeze({
  INIT: 'init',
  PAGEVIEW: 'pageview',
  EVENT: 'event',
  API: 'api',
  CONFIG: 'config',
  DEDUPE: 'dedupe',
  USER: 'user'
});

// Configuração padrão
const config = {
  enabled: true,
  minLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  prefix: '[GA4]'
};

// Função para verificar se o log deve ser exibido
const shouldLog = (level) => {
  if (!config.enabled) return false;
  
  const levels = Object.values(LogLevel);
  const configLevelIndex = levels.indexOf(config.minLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= configLevelIndex;
};

// Funções de log
export const logger = {
  debug: (category, message, data) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(`${config.prefix} [${category}] ${message}`, data || '');
    }
  },
  
  info: (category, message, data) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(`${config.prefix} [${category}] ${message}`, data || '');
    }
  },
  
  warn: (category, message, data) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(`${config.prefix} [${category}] ${message}`, data || '');
    }
  },
  
  error: (category, message, data) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(`${config.prefix} [${category}] ${message}`, data || '');
    }
  }
}; 