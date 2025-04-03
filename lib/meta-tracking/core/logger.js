"use client";

// Categorias de log para melhor organização
export const LogCategory = {
  INIT: 'Initialization',
  PIXEL: 'Meta Pixel',
  CONVERSION_API: 'Conversion API',
  PAGEVIEW: 'PageView',
  EVENT: 'Event Tracking',
  DEDUPE: 'Deduplication',
  DATA: 'Data Collection',
  HASH: 'Data Hashing',
  ERROR: 'Error'
};

// Níveis de log
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Configuração padrão do logger
const defaultConfig = {
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  prefix: '[Meta Pixel]',
  enabled: true,
  showTimestamp: true
};

// Configuração atual (pode ser modificada em runtime)
let config = { ...defaultConfig };

/**
 * Logger para o Meta Pixel
 */
export const logger = {
  /**
   * Configura o logger
   * @param {Object} newConfig - Nova configuração
   */
  configure(newConfig) {
    config = { ...config, ...newConfig };
  },

  /**
   * Retorna a configuração atual
   * @returns {Object} Configuração atual
   */
  getConfig() {
    return { ...config };
  },

  /**
   * Verifica se um nível de log deve ser exibido
   * @param {number} level - Nível do log
   * @returns {boolean} Se deve exibir
   */
  shouldLog(level) {
    return config.enabled && level >= config.level;
  },

  /**
   * Formata a mensagem com prefixo e timestamp
   * @param {string} category - Categoria do log
   * @param {string} message - Mensagem
   * @returns {string} Mensagem formatada
   */
  formatMessage(category, message) {
    const prefix = config.prefix;
    const timestamp = config.showTimestamp ? `[${new Date().toLocaleTimeString()}]` : '';
    return `${timestamp} ${prefix} [${category}] ${message}`;
  },

  /**
   * Log de debug
   * @param {string} category - Categoria do log
   * @param {string} message - Mensagem
   * @param {Object} data - Dados opcionais
   */
  debug(category, message, data) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    if (data) {
      console.debug(this.formatMessage(category, message), data);
    } else {
      console.debug(this.formatMessage(category, message));
    }
  },

  /**
   * Log de informação
   * @param {string} category - Categoria do log
   * @param {string} message - Mensagem
   * @param {Object} data - Dados opcionais
   */
  info(category, message, data) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    if (data) {
      console.log(this.formatMessage(category, message), data);
    } else {
      console.log(this.formatMessage(category, message));
    }
  },

  /**
   * Log de aviso
   * @param {string} category - Categoria do log
   * @param {string} message - Mensagem
   * @param {Object} data - Dados opcionais
   */
  warn(category, message, data) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    if (data) {
      console.warn(this.formatMessage(category, message), data);
    } else {
      console.warn(this.formatMessage(category, message));
    }
  },

  /**
   * Log de erro
   * @param {string} category - Categoria do log
   * @param {string} message - Mensagem
   * @param {Object} data - Dados opcionais
   */
  error(category, message, data) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    if (data) {
      console.error(this.formatMessage(category, message), data);
    } else {
      console.error(this.formatMessage(category, message));
    }
  }
}; 