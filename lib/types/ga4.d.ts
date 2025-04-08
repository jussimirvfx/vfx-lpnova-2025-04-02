// Tipos para o Google Analytics 4

// Evento básico do GA4
export interface GA4Event {
  name: string;
  params?: Record<string, any>;
  client_id?: string;
  user_id?: string;
  timestamp_micros?: number;
  non_personalized_ads?: boolean;
}

// Evento do GA4 para envio via Measurement Protocol
export interface GA4MeasurementEvent extends GA4Event {
  api_secret: string;
}

// Evento para API de medição GA4
export interface GA4APIEvent {
  name: string;
  params?: Record<string, any>;
  event_id?: string;
}

// Configuração do tracking GA4
export interface GA4TrackingConfig {
  MEASUREMENT_ID: string | undefined;
  API_SECRET?: string;
  DEDUPLICATION: {
    MAX_AGE_HOURS: number;
  };
  COOKIES: {
    TRACKING_DATA: string;
    MAX_AGE_DAYS: number;
    SECURE: boolean;
    SAME_SITE: string;
  };
  LOGGING: {
    VERBOSE: boolean;
    PREFIX: string;
  };
  STANDARD_EVENTS: readonly string[];
  UNIVERSAL_PARAMETERS: readonly string[];
}

// Dados que serão armazenados nos cookies
export interface GA4TrackingData {
  client_id?: string;
  user_id?: string;
  session_id?: string;
  first_visit_time?: number;
}

// Tipos para o hook useGA4
export interface UseGA4Return {
  isInitialized: boolean;
  initializeGA4: (measurementIdOverride?: string) => { isInitialized: boolean; error?: any };
  trackPageView: (options?: GA4PageViewOptions) => Promise<boolean>;
  trackEvent: (name: string, params?: Record<string, any>, options?: GA4EventOptions) => Promise<boolean>;
  trackConversion: (conversionId: string, conversionLabel: string, params?: Record<string, any>) => Promise<boolean>;
}

// Opções para evento PageView
export interface GA4PageViewOptions {
  path?: string;
  title?: string;
  deduplicateView?: boolean;
  additionalParams?: Record<string, any>;
  nonInteraction?: boolean;
}

// Opções para eventos GA4
export interface GA4EventOptions {
  deduplicateEvent?: boolean;
  eventId?: string;
  nonInteraction?: boolean;
  sendToServerAPI?: boolean;
}

// Tipos para window global
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    _ga4Initialized: boolean;
    _ga4Logs: {
      getLogs: () => any[];
      getLogsByCategory: (category: string) => any[];
      clear: () => void;
    };
    _ga4ScriptLoaded?: boolean;
  }
}

// Categorias de log para o GA4
export enum LogCategory {
  INIT = 'init',
  PAGEVIEW = 'pageview',
  EVENT = 'event',
  CONVERSION = 'conversion',
  MEASUREMENT_API = 'measurement-api',
  ERROR = 'error',
  DEBUG = 'debug',
} 