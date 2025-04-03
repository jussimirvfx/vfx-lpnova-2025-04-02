// Configurações do Meta Pixel

// Valores padrão embutidos (fallback) caso as variáveis de ambiente não estejam disponíveis
const FALLBACK_VALUES = {
  // Token de acesso para a API de Conversões (fallback para desenvolvimento/testes)
  API_TOKEN: 'EAAP5yQs70lwBO0fduf8kMZBsu1dAG8X4yyQ4YuRjQ8gqDcJPu1Fn3m9psxoaamasgDnQ7DyOLx2wLBhzXFYmg5aric5lxxXNQn4DRv0uHlMNldZB9lcx2gppRMyzPZALKSGOQSzTSd8dDZBoZAslWBl7VTF6CmEHHdYAW3ysz4xIZCtl5tHZCMitAVOi6zdpeGUXgZDZD',
  // Código de teste para eventos
  TEST_CODE: 'TEST75192',
  // ID do Pixel
  PIXEL_ID: '191914309246603'
};

// Verificar status das variáveis de ambiente no carregamento
if (typeof window !== 'undefined') {
  // Executar após o carregamento do DOM para garantir que os logs apareçam
  setTimeout(() => {
    // Verificar se usamos valores do ambiente ou fallback
    const usingEnvApiToken = !!process.env.META_API_ACCESS_TOKEN;
    const usingEnvTestCode = !!process.env.META_TEST_EVENT_CODE;
    const usingEnvPixelId = !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    
    // Token real ou fallback
    const actualApiToken = process.env.META_API_ACCESS_TOKEN || FALLBACK_VALUES.API_TOKEN;
    const actualTestCode = process.env.META_TEST_EVENT_CODE || FALLBACK_VALUES.TEST_CODE;
    const actualPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || FALLBACK_VALUES.PIXEL_ID;
    
    console.log('==================== DIAGNÓSTICO DE VARIÁVEIS META ====================');
    console.log('META_API_ACCESS_TOKEN status:', {
      exists: usingEnvApiToken,
      usingFallback: !usingEnvApiToken,
      length: actualApiToken.length,
      preview: actualApiToken 
        ? `${actualApiToken.substring(0, 8)}...${actualApiToken.substring(actualApiToken.length - 5)}`
        : 'VAZIA',
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV || 'não definido',
      timestamp: new Date().toISOString()
    });
    console.log('META_TEST_EVENT_CODE:', {
      value: actualTestCode,
      source: usingEnvTestCode ? 'process.env' : 'fallback'
    });
    console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', {
      value: actualPixelId,
      usingFallback: !usingEnvPixelId
    });
    console.log('===================================================================');
  }, 500);
}

export const META_PIXEL_CONFIG = {
  // ID do Pixel do Meta
  PIXEL_ID: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || FALLBACK_VALUES.PIXEL_ID,

  // Token de acesso para a API de Conversões - usar valor padrão embutido caso a variável não exista
  ACCESS_TOKEN: process.env.META_API_ACCESS_TOKEN || FALLBACK_VALUES.API_TOKEN,

  // Código de teste para eventos - usar valor padrão embutido
  TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE || FALLBACK_VALUES.TEST_CODE,

  // Configurações de deduplicação
  DEDUPLICATION: {
    // Tempo máximo em horas para considerar um evento como duplicado
    MAX_AGE_HOURS: 24,
  },

  // Configurações de cookies
  COOKIES: {
    // Nome do cookie para armazenar dados de rastreamento
    TRACKING_DATA: 'fbp',
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
    PREFIX: '[Meta Pixel]',
  },

  // Lista de eventos padrão do Meta Pixel
  STANDARD_EVENTS: [
    'PageView',
    'ViewContent',
    'Contact',
    'Lead',
    'ScrollDepth',
  ] as const,

  // Parâmetros universais que devem estar presentes em todos os eventos
  UNIVERSAL_PARAMETERS: [
    'event_time',
    'event_source_url',
    'page_title',
    'page_path',
  ] as const,
} as const

// Tipos para os eventos padrão
export type StandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Contact'
  | 'Lead'
  | 'ScrollDepth'

// Tipos para os parâmetros universais
export type UniversalParameter = typeof META_PIXEL_CONFIG.UNIVERSAL_PARAMETERS[number]

// Tipos para as configurações de logging
export interface MetaPixelLogging {
  VERBOSE: boolean
  PREFIX: string
} 