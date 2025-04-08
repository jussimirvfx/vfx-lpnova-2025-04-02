"use client";

import { GA4_CONFIG } from "../config/ga4";
import { LogCategory } from "../types";

// Níveis de log disponíveis
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Interface para o registro de log
interface LogRecord {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

// Nível de log padrão com base no ambiente
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

// Função para criar o logger
function createLogger() {
  // Cache de logs em memória
  let logs: LogRecord[] = [];
  let enabled = true;
  let logLevel = DEFAULT_LOG_LEVEL;
  const prefix = GA4_CONFIG.LOGGING.PREFIX;
  
  // Inicializar logs no objeto window para acesso via console
  if (typeof window !== 'undefined') {
    window._ga4Logs = {
      getLogs: () => [...logs],
      getLogsByCategory: (category: string) => logs.filter(log => log.category === category),
      clear: () => { logs = []; },
    };
  }
  
  // Função interna para adicionar log
  function addLog(level: LogLevel, category: string, message: string, data?: any) {
    if (!enabled || level < logLevel) return;
    
    const record: LogRecord = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };
    
    logs.push(record);
    
    // Limitar tamanho do cache
    if (logs.length > 1000) {
      logs.shift();
    }
    
    // Log no console com base no nível
    const logFn = level === LogLevel.ERROR ? console.error :
                  level === LogLevel.WARN ? console.warn :
                  level === LogLevel.INFO ? console.info :
                  console.debug;
    
    // Formatar mensagem de log
    const formattedMessage = `${prefix} [${category.toUpperCase()}] ${message}`;
    
    // Log no console
    if (data) {
      logFn(formattedMessage, data);
    } else {
      logFn(formattedMessage);
    }
  }
  
  // API pública do logger
  return {
    // Habilitar/desabilitar logs
    enable: (value = true) => { enabled = value; },
    
    // Configurar nível de log
    setLevel: (level: LogLevel) => { logLevel = level; },
    
    // Métodos de log
    debug: (category: LogCategory | string, message: string, data?: any) => {
      addLog(LogLevel.DEBUG, category, message, data);
    },
    
    info: (category: LogCategory | string, message: string, data?: any) => {
      addLog(LogLevel.INFO, category, message, data);
    },
    
    warn: (category: LogCategory | string, message: string, data?: any) => {
      addLog(LogLevel.WARN, category, message, data);
    },
    
    error: (category: LogCategory | string, message: string, data?: any) => {
      addLog(LogLevel.ERROR, category, message, data);
    },
    
    // Utilitários
    getLogs: () => [...logs],
    getLogsByCategory: (category: string) => logs.filter(log => log.category === category),
    clear: () => { logs = []; }
  };
}

// Exportar instância do logger
const ga4Logger = createLogger();
export default ga4Logger; 