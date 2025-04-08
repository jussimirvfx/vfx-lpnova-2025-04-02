// Configurações do Google Analytics 4 (GA4)

// Criação de configurações específicas para cliente e servidor
const CLIENT_CONFIG = {
  // ID de medição do GA4 (disponível no cliente com prefixo NEXT_PUBLIC_)
  MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,

  // Configurações de deduplicação
  DEDUPLICATION: {
    // Tempo máximo em horas para considerar um evento como duplicado
    MAX_AGE_HOURS: 24,
  },

  // Configurações de cookies
  COOKIES: {
    // Nome do cookie para armazenar dados de rastreamento
    TRACKING_DATA: 'ga4',
    // Tempo máximo de vida do cookie em dias
    MAX_AGE_DAYS: 180,
    // Se o cookie deve ser enviado apenas em conexões seguras
    SECURE: true,
    // Política de SameSite para o cookie
    SAME_SITE: 'Strict' as const,
  },

  // Configurações de logging
  LOGGING: {
    // Se deve exibir logs detalhados
    VERBOSE: process.env.NODE_ENV === 'development',
    // Prefixo para as mensagens de log
    PREFIX: '[GA4]',
  },

  // Lista de eventos padrão do GA4
  STANDARD_EVENTS: [
    'page_view',
    'view_item',
    'generate_lead',
    'scroll',
  ] as const,

  // Parâmetros universais que devem estar presentes em todos os eventos
  UNIVERSAL_PARAMETERS: [
    'engagement_time_msec',
    'page_location',
    'page_title',
  ] as const,
} as const;

// Função para obter configuração do cliente (client-side only)
// Esta função só deve ser chamada em componentes do cliente
export function getClientGA4Config() {
  return CLIENT_CONFIG;
}

// Função para obter configuração do servidor (server-side only)
// Esta função só deve ser chamada em arquivos do servidor (API routes, Server Components, etc.)
export function getServerGA4Config() {
  // Verificar variáveis obrigatórias no servidor
  const API_SECRET = process.env.GA4_API_SECRET;
  const SERVER_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  
  // Verificação apenas em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const hasApiSecret = !!API_SECRET;
    const hasMeasurementId = !!SERVER_MEASUREMENT_ID;
    
    if (!hasApiSecret || !hasMeasurementId) {
      console.error('==================== ERRO: VARIÁVEIS DE AMBIENTE GA4 (SERVIDOR) NÃO CONFIGURADAS ====================');
      console.error('As seguintes variáveis de ambiente são obrigatórias no servidor:');
      if (!hasApiSecret) console.error('- GA4_API_SECRET');
      if (!hasMeasurementId) console.error('- NEXT_PUBLIC_GA4_MEASUREMENT_ID');
      console.error('===================================================================');
    }
  }
  
  // Retornar objeto de configuração do servidor
  return {
    ...CLIENT_CONFIG,
    MEASUREMENT_ID: SERVER_MEASUREMENT_ID,
    API_SECRET,
  };
}

// Tipo de exportação para facilitar referência
export const GA4_CONFIG = CLIENT_CONFIG;

// Configurações para retry da API
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  initialDelayMs: 1000, // 1 segundo
}; 