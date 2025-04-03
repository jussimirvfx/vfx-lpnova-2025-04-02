import type { StandardEvent } from '../config/meta-pixel'

// Tipos para os eventos do Meta Pixel
export interface MetaPixelEvent {
  event_name: StandardEvent | string
  event_id?: string
  custom_data?: Record<string, any>
  event_source_url?: string
  event_time?: number
  action_source?: 'website' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other'
  user_data?: Record<string, any>
  content_name?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
  content_category?: string
  num_items?: number
  search_string?: string
  status?: boolean
  description?: string
  scroll_depth?: number
  page_path?: string
  [key: string]: any
}

// Tipos para o Meta Pixel
export interface MetaPixelOptions {
  eventID?: string
  user_data?: Record<string, any>
  [key: string]: any
}

// Tipos para o hook
export interface MetaPixelHook {
  trackEvent: (eventName: StandardEvent | string, params?: Record<string, any>, options?: MetaPixelOptions) => Promise<void>
  trackPageView: () => Promise<void>
  trackCustomEvent: (eventName: string, params?: Record<string, any>) => Promise<void>
  initializePixel: (pixelId: string) => void
  isInitialized: boolean
}

// Tipos para o Meta Pixel
export interface MetaPixelInstance {
  (action: string, event: string, params?: Record<string, any>, options?: { eventID?: string; [key: string]: any }): void
  push?: Function
  loaded?: boolean
  version?: string
  queue?: any[]
  callMethod?: Function
  disableAutoConfig?: boolean
}

// Tipos para o window global
declare global {
  interface Window {
    fbq: MetaPixelInstance
    _fbq: any
    _fbPixelInitialized: boolean
    _fbProtectorInstalled: boolean
    _fbPixelProtected: boolean
    _fbq_intercepted: boolean
    _fbq_disable_preload: boolean
    _fbq_init_options: { no_script: number }
    _fbq_calls: any[][]
    _metaPixelLogs: {
      getLogs: () => any[]
      getLogsByCategory: (category: string) => any[]
      clear: () => void
    }
    _fbPixelScriptLoaded?: boolean
  }
}

// Tipos para as configurações de logging
export interface MetaPixelLogging {
  VERBOSE: boolean
  PREFIX: string
}

// Tipos para as configurações do Meta Pixel
export interface MetaPixelConfig {
  PIXEL_ID: string
  ACCESS_TOKEN?: string
  TEST_EVENT_CODE?: string
  DEDUPLICATION: {
    MAX_AGE_HOURS: number
  }
  COOKIES: {
    TRACKING_DATA: string
    MAX_AGE_DAYS: number
    SECURE: boolean
    SAME_SITE: 'Strict' | 'Lax' | 'None'
  }
  LOGGING: MetaPixelLogging
  STANDARD_EVENTS: readonly StandardEvent[]
  UNIVERSAL_PARAMETERS: readonly string[]
}

// Tipos relacionados ao Facebook Pixel

/**
 * Interface para extensão do objeto Window global com propriedades do Facebook Pixel
 */
interface Window {
  fbq?: Function;
  _fbq?: any;
  _fbPixelInitialized?: boolean;
  _fbPixelScriptLoaded?: boolean;
  _metaPixelLogs?: any[];
}

/**
 * Parâmetros para eventos do Facebook Pixel
 */
export interface FacebookEventParams {
  [key: string]: any;
}

/**
 * Opções para inicialização do Facebook Pixel
 */
export interface FacebookInitOptions {
  agent?: string;
  autoConfig?: boolean;
  debug?: boolean;
  version?: string;
}

/**
 * Opções para eventos do Conversion API
 */
export interface ConversionApiOptions {
  eventId?: string;
  eventSourceUrl?: string;
  userAgent?: string;
  userIp?: string;
  fbc?: string;
  fbp?: string;
  em?: string;
  ph?: string;
}

/**
 * Payload para a Conversion API do Facebook
 */
export interface ConversionApiPayload {
  data: Array<{
    event_name: string;
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: string;
    user_data: {
      client_user_agent?: string;
      client_ip_address?: string | null;
      fbp?: string | null;
      fbc?: string | null;
      [key: string]: any;
    };
    custom_data: {
      [key: string]: any;
    };
  }>;
  access_token: string;
  test_event_code?: string;
}

/**
 * Resposta da Conversion API do Facebook
 */
export interface ConversionApiResponse {
  events_received?: number;
  messages?: string[];
  fbtrace_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
} 