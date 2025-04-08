/**
 * Configuração do GA4
 * 
 * Contém as configurações básicas para o GA4 e Measurement Protocol
 */

export const GA4_CONFIG = {
  // Configuração básica
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',
  API_SECRET: process.env.GA4_API_SECRET || '',
  
  // Endpoint do Measurement Protocol
  MEASUREMENT_PROTOCOL_ENDPOINT: 'https://www.google-analytics.com/mp/collect',
  
  // Debug endpoint (para uso em desenvolvimento)
  DEBUG_ENDPOINT: 'https://www.google-analytics.com/debug/mp/collect',
  
  // Configuração de logging
  LOGGING: {
    PREFIX: '🔍 GA4',
    ENABLED: process.env.NODE_ENV === 'development',
    LEVEL: 'info', // 'debug' | 'info' | 'warn' | 'error'
  },
  
  // Namespace para armazenamento local
  STORAGE_NAMESPACE: '_ga4_events_sent',
  
  // Expirações para deduplicação de eventos (em milissegundos)
  EVENT_EXPIRATION: {
    page_view: 5 * 60 * 1000,        // 5 minutos
    scroll: 15 * 60 * 1000,           // 15 minutos
    view_item: 30 * 60 * 1000,        // 30 minutos
    contact: 1 * 60 * 60 * 1000,      // 1 hora
    generate_lead: 24 * 60 * 60 * 1000, // 24 horas
    sign_up: 24 * 60 * 60 * 1000,     // 24 horas
    default: 6 * 60 * 60 * 1000       // 6 horas (padrão)
  },
  
  // Mapeamento de eventos Meta para GA4
  META_TO_GA4_EVENT_MAPPING: {
    'PageView': 'page_view',
    'Scroll': 'scroll',
    'ViewContent': 'view_item',
    'Contact': 'contact',
    'Lead': 'generate_lead',
    'SubmitApplication': 'sign_up',
    'VideoPlay': 'video_progress'
  },
  
  // Pontos de scroll para rastreamento
  SCROLL_THRESHOLDS: [25, 50, 75, 90]
}; 