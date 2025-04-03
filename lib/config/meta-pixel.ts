// Configurações do Meta Pixel

// Verificar status das variáveis de ambiente no carregamento
if (typeof window !== 'undefined') {
  // Executar após o carregamento do DOM para garantir que os logs apareçam
  setTimeout(() => {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    const hasApiToken = !!process.env.META_API_ACCESS_TOKEN;
    const hasTestCode = !!process.env.META_TEST_EVENT_CODE;
    const hasPixelId = !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    
    if (!hasApiToken || !hasTestCode || !hasPixelId) {
      console.error('==================== ERRO: VARIÁVEIS DE AMBIENTE META NÃO CONFIGURADAS ====================');
      console.error('As seguintes variáveis de ambiente são obrigatórias:');
      if (!hasApiToken) console.error('- META_API_ACCESS_TOKEN');
      if (!hasTestCode) console.error('- META_TEST_EVENT_CODE');
      if (!hasPixelId) console.error('- NEXT_PUBLIC_FACEBOOK_PIXEL_ID');
      console.error('===================================================================');
    }
    
    console.log('==================== DIAGNÓSTICO DE VARIÁVEIS META ====================');
    console.log('META_API_ACCESS_TOKEN status:', {
      exists: hasApiToken,
      length: process.env.META_API_ACCESS_TOKEN?.length || 0,
      preview: process.env.META_API_ACCESS_TOKEN 
        ? `${process.env.META_API_ACCESS_TOKEN.substring(0, 4)}...${process.env.META_API_ACCESS_TOKEN.substring(process.env.META_API_ACCESS_TOKEN.length - 4)}`
        : 'VAZIA',
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV || 'não definido',
      timestamp: new Date().toISOString()
    });
    console.log('META_TEST_EVENT_CODE:', {
      value: process.env.META_TEST_EVENT_CODE,
      source: 'process.env'
    });
    console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', {
      value: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      exists: hasPixelId
    });
    console.log('===================================================================');
  }, 500);
}

export const META_PIXEL_CONFIG = {
  // ID do Pixel do Meta
  PIXEL_ID: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,

  // Token de acesso para a API de Conversões
  ACCESS_TOKEN: process.env.META_API_ACCESS_TOKEN,

  // Código de teste para eventos
  TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE,

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