"use client";

/**
 * Configurações do lado do cliente (browser)
 */
const CLIENT_CONFIG = {
  // ID do Pixel do Meta
  PIXEL_ID: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,

  // Configurações de deduplicação
  DEDUPLICATION: {
    MAX_AGE_HOURS: 24,
  },

  // Configurações de cookies
  COOKIES: {
    TRACKING_DATA: 'fbp',
    MAX_AGE_DAYS: 180,
    SECURE: true,
    SAME_SITE: 'Strict',
  },

  // Configurações de logging
  LOGGING: {
    VERBOSE: process.env.NODE_ENV === 'development',
    PREFIX: '[Meta Pixel]',
  },

  // Lista de eventos padrão
  STANDARD_EVENTS: [
    'PageView',
    'ViewContent',
    'Contact',
    'Lead',
    'Scroll',
    'SubmitApplication',
    'VideoView'
  ],

  // Parâmetros universais
  UNIVERSAL_PARAMETERS: [
    'event_time',
    'event_source_url',
    'page_title',
    'page_path',
  ],
};

/**
 * Obtém configurações para o lado do cliente
 * @returns {Object} Configurações do cliente
 */
export function getConfig() {
  // Diagnosticar variáveis de ambiente no cliente
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('==================== DIAGNÓSTICO META PIXEL (CLIENTE) ====================');
      console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', CLIENT_CONFIG.PIXEL_ID || 'não definido');
      console.log('===================================================================');
    }, 500);
  }
  
  return CLIENT_CONFIG;
}

/**
 * Obtém configurações para o lado do servidor
 * @returns {Object} Configurações do servidor
 */
export function getServerConfig() {
  // Variáveis do servidor
  const ACCESS_TOKEN = process.env.META_API_ACCESS_TOKEN;
  const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
  const SERVER_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  
  // No ambiente de desenvolvimento, diagnóstico completo
  if (process.env.NODE_ENV === 'development') {
    console.log('============ DIAGNÓSTICO META PIXEL (SERVIDOR) ============');
    console.log('PIXEL_ID:', SERVER_PIXEL_ID || 'não definido');
    console.log('ACCESS_TOKEN:', ACCESS_TOKEN ? 'configurado' : 'não definido');
    console.log('TEST_EVENT_CODE:', TEST_EVENT_CODE || 'não definido');
    console.log('======================================================');
  }
  
  // Mostrar todas as variáveis de ambiente relacionadas ao Meta
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('============ DIAGNÓSTICO COMPLETO DE VARIÁVEIS (SERVIDOR) ============');
    console.log('Todas as variáveis disponíveis:');
    Object.keys(process.env).filter(key => 
      key.startsWith('META_') || 
      key.startsWith('FACEBOOK_') || 
      key.startsWith('NEXT_PUBLIC_FACEBOOK_')
    ).forEach(key => {
      const value = process.env[key];
      console.log(`- ${key}: ${value ? 
        (key.includes('TOKEN') ? 
          `${value.substring(0, 4)}...${value.length > 8 ? value.substring(value.length - 4) : ''}` 
          : key.includes('PIXEL_ID') ? 
            `${value.substring(0, 5)}...` 
            : value
        ) 
        : 'não definido'}`);
    });
    console.log('===================================================================');
  }
  
  return {
    ...CLIENT_CONFIG,
    PIXEL_ID: SERVER_PIXEL_ID,
    ACCESS_TOKEN,
    TEST_EVENT_CODE,
  };
} 