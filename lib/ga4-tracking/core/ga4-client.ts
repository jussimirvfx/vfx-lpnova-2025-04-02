/**
 * Core do GA4 (Client-side)
 * Responsável pela inicialização e gerenciamento do GA4 no lado do cliente.
 */

import { GA4_CONFIG } from '../config/ga4-config';
import { isEventAlreadySent, markEventAsSent } from './event-deduplication';

// Interface para o objeto window com GA
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    _ga4Initialized?: boolean;
    _ga4ClientId?: string;
    sendGA4Event?: (
      eventName: string,
      params?: Record<string, any>,
      options?: {
        skipDeduplication?: boolean;
        sendToServer?: boolean;
      }
    ) => Promise<boolean>;
  }
}

// Estado de inicialização
let isInitialized = false;

/**
 * Obter o Client ID do GA4
 * Importante para deduplicação entre cliente e servidor
 */
export function getClientId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Verificar se já temos o client_id em memória
  if (window._ga4ClientId) return window._ga4ClientId;
  
  try {
    // Tentar obter o client_id dos cookies
    const cookies = document.cookie.split(';');
    const gaCookie = cookies.find(c => c.trim().startsWith('_ga='));
    
    if (gaCookie) {
      // Formato do cookie: _ga=GA1.1.1234567890.1234567890
      // Queremos extrair o 1234567890.1234567890
      const parts = gaCookie.trim().split('.');
      if (parts.length >= 4) {
        const clientId = `${parts[2]}.${parts[3]}`;
        window._ga4ClientId = clientId;
        return clientId;
      }
    }
    
    // Se não encontrou, gerar um novo
    const newClientId = `${Math.random().toString(36).substring(2)}.${Date.now()}`;
    window._ga4ClientId = newClientId;
    return newClientId;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao obter client_id:`, error);
    return null;
  }
}

/**
 * Inicializar o GA4
 */
export function initializeGA4(): boolean {
  // Verificar se estamos no lado do cliente
  if (typeof window === 'undefined') return false;
  
  // Verificar se já foi inicializado
  if (isInitialized || window._ga4Initialized) {
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] GA4 já inicializado, pulando...`);
    }
    isInitialized = true;
    return true;
  }
  
  // Verificar se o MEASUREMENT_ID está configurado
  if (!GA4_CONFIG.MEASUREMENT_ID) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] NEXT_PUBLIC_GA4_MEASUREMENT_ID não está definido nas variáveis de ambiente`);
    return false;
  }
  
  if (GA4_CONFIG.LOGGING.ENABLED) {
    console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Inicializando GA4 com ID: ${GA4_CONFIG.MEASUREMENT_ID}`);
  }
  
  // Verificar se o gtag já foi definido pelo script carregado
  if (!window.gtag && window.dataLayer) {
    window.gtag = function(...args) { 
      window.dataLayer?.push(arguments); 
    };
  }
  
  // Definir a função global para enviar eventos
  window.sendGA4Event = async (eventName, params = {}, options = {}) => {
    return sendEvent(eventName, params, options);
  };
  
  // Marcar como inicializado
  isInitialized = true;
  window._ga4Initialized = true;
  
  // Diagnóstico para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 ====================');
    console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID status:', GA4_CONFIG.MEASUREMENT_ID ? 'Configurado' : 'Não configurado');
    console.log('GA4_API_SECRET status:', GA4_CONFIG.API_SECRET ? 'Configurado (não visível no cliente)' : 'Não configurado');
    console.log('===================================================================');
  }
  
  return true;
}

/**
 * Enviar evento para o GA4
 */
export async function sendEvent(
  eventName: string,
  params: Record<string, any> = {},
  options: {
    skipDeduplication?: boolean;
    sendToServer?: boolean;
  } = {}
): Promise<boolean> {
  // Verificar se estamos no lado do cliente
  if (typeof window === 'undefined') return false;
  
  // Inicializar o GA4 se ainda não foi feito
  if (!isInitialized) {
    initializeGA4();
  }
  
  // Verificar deduplicação, exceto se skipDeduplication for true
  const identifier = params.item_id || params.item_name || params.page_location || 'default';
  if (!options.skipDeduplication && isEventAlreadySent(eventName, identifier)) {
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Evento ${eventName} já foi enviado para ${identifier}, ignorando...`);
    }
    return false;
  }
  
  try {
    // Adicionar parâmetros comuns
    const finalParams = {
      ...params,
      send_to: GA4_CONFIG.MEASUREMENT_ID,
    };
    
    // Enviar evento para o GA4
    if (window.gtag) {
      if (GA4_CONFIG.LOGGING.ENABLED) {
        console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Enviando evento ${eventName}:`, finalParams);
      }
      
      window.gtag('event', eventName, finalParams);
      
      // Marcar evento como enviado para evitar duplicações futuras
      if (!options.skipDeduplication) {
        markEventAsSent(eventName, identifier);
      }
      
      // Se solicitado, enviar também para o servidor via Measurement Protocol
      if (options.sendToServer) {
        // Usar a API personalizada em vez do Measurement Protocol direto
        const clientId = getClientId();
        if (clientId) {
          try {
            await fetch('/api/ga4', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                event_name: eventName,
                client_id: clientId,
                params: finalParams
              })
            });
            
            if (GA4_CONFIG.LOGGING.ENABLED) {
              console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Evento ${eventName} enviado para o servidor`);
            }
          } catch (error) {
            console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar evento ${eventName} para o servidor:`, error);
          }
        }
      }
      
      return true;
    } else {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] gtag não está disponível, evento ${eventName} não enviado`);
      return false;
    }
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar evento ${eventName}:`, error);
    return false;
  }
}

/**
 * Enviar evento page_view para o GA4
 */
export function trackPageView(params: Record<string, any> = {}): Promise<boolean> {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const title = typeof document !== 'undefined' ? document.title : '';
  
  return sendEvent('page_view', {
    page_location: url,
    page_path: path,
    page_title: title,
    ...params
  }, {
    // Enviar page_view para o servidor também para garantir contagem precisa
    sendToServer: true
  });
}

/**
 * Mapear evento do Meta para GA4
 */
export function mapMetaEventToGA4(metaEventName: string): string {
  return GA4_CONFIG.META_TO_GA4_EVENT_MAPPING[metaEventName as keyof typeof GA4_CONFIG.META_TO_GA4_EVENT_MAPPING] || metaEventName.toLowerCase();
} 