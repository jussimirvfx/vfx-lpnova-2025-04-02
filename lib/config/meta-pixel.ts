// Configurações do Meta Pixel

// Criação de configurações específicas para cliente e servidor
const CLIENT_CONFIG = {
  // ID do Pixel do Meta (disponível no cliente com prefixo NEXT_PUBLIC_)
  PIXEL_ID: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,

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
} as const;

// Verificar status das variáveis de ambiente no carregamento (apenas no cliente)
if (typeof window !== 'undefined') {
  // Executar após o carregamento do DOM para garantir que os logs apareçam
  setTimeout(() => {
    // Verificar se as variáveis de ambiente necessárias estão definidas
    const hasPixelId = !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    
    if (!hasPixelId) {
      console.error('==================== ERRO: VARIÁVEIS DE AMBIENTE META NÃO CONFIGURADAS ====================');
      console.error('A seguinte variável de ambiente é obrigatória no cliente:');
      console.error('- NEXT_PUBLIC_FACEBOOK_PIXEL_ID');
      console.error('===================================================================');
    }
    
    console.log('==================== DIAGNÓSTICO DE VARIÁVEIS META (CLIENTE) ====================');
    console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', {
      value: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
      exists: hasPixelId
    });
    console.log('===================================================================');
  }, 500);
}

// Exportar a configuração do cliente
export const META_PIXEL_CONFIG = CLIENT_CONFIG;

// Função para obter configuração do servidor (server-side only)
// Esta função só deve ser chamada em arquivos do servidor (API routes, Server Components, etc.)
export function getServerMetaConfig() {
  // Verificar variáveis obrigatórias no servidor
  const ACCESS_TOKEN = process.env.META_API_ACCESS_TOKEN;
  const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
  const SERVER_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  
  // Verificação apenas em ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const hasApiToken = !!ACCESS_TOKEN;
    const hasTestCode = !!TEST_EVENT_CODE;
    const hasPixelId = !!SERVER_PIXEL_ID;
    
    if (!hasApiToken || !hasTestCode || !hasPixelId) {
      console.error('==================== ERRO: VARIÁVEIS DE AMBIENTE META (SERVIDOR) NÃO CONFIGURADAS ====================');
      console.error('As seguintes variáveis de ambiente são obrigatórias no servidor:');
      if (!hasApiToken) console.error('- META_API_ACCESS_TOKEN');
      if (!hasTestCode) console.error('- META_TEST_EVENT_CODE');
      if (!hasPixelId) console.error('- FACEBOOK_PIXEL_ID');
      console.error('===================================================================');
    }
  }
  
  // Retornar objeto de configuração do servidor
  return {
    ...CLIENT_CONFIG,
    PIXEL_ID: SERVER_PIXEL_ID,
    ACCESS_TOKEN,
    TEST_EVENT_CODE,
  };
}

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