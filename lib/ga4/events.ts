import { hasEventBeenSent, markEventAsSent } from './storage';
import { queueEvent } from './queue';

// Tipagem para os parâmetros de item GA4 (e-commerce)
interface ItemParams {
    item_id?: string;
    item_name?: string;
    item_brand?: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    item_category4?: string;
    item_category5?: string;
    item_variant?: string;
    price?: number | string;
    quantity?: number;
    coupon?: string;
    index?: number;
    // Add other standard item parameters as needed
}

// Tipagem para os parâmetros de evento GA4
interface EventParams {
  // Permite chaves padrão com valores primitivos
  [key: string]: string | number | boolean | undefined | ItemParams[];
  // Permite especificamente a chave 'items' com um array de ItemParams
  items?: ItemParams[];
}

// Tipagem para os dados do evento do Measurement Protocol
interface MPEventData {
  client_id: string;
  non_personalized_ads?: boolean;
  user_properties?: { [key: string]: { value: string | number | boolean } };
  events: Array<{
    name: string;
    params: EventParams;
  }>;
}

// URL da nossa API interna para o Measurement Protocol
const GA4_MP_ENDPOINT = '/api/ga4/event';

/**
 * Envia um evento para o Google Analytics 4 usando gtag (lado do cliente).
 * Inclui verificação de duplicatas antes de enviar.
 * Se o gtag não estiver disponível, enfileira o evento para envio posterior.
 *
 * @param {string} eventName Nome do evento GA4 (ex: 'generate_lead').
 * @param {EventParams} params Parâmetros adicionais do evento.
 * @param {string} [uniqueIdentifier] Identificador único para deduplicação (ex: ID do formulário, URL da página).
 */
export const sendGA4Event = (eventName: string, params: EventParams = {}, uniqueIdentifier?: string): void => {
  // Não envia se não estiver no navegador
  if (typeof window === 'undefined') {
    console.warn('GA4 Event: Não estamos no navegador.');
    return;
  }

  // Verifica se o evento já foi enviado para este identificador
  if (uniqueIdentifier && hasEventBeenSent(eventName, uniqueIdentifier)) {
    console.log(`GA4 Event: Evento "${eventName}" com ID "${uniqueIdentifier}" já enviado. Prevenindo duplicata.`);
    return;
  }
  if (!uniqueIdentifier && hasEventBeenSent(eventName)) {
    console.log(`GA4 Event: Evento "${eventName}" já enviado. Prevenindo duplicata.`);
    return;
  }

  // Verificar se gtag está disponível
  if (typeof (window as any).gtag !== 'function') {
    console.log(`GA4 Event: gtag não está disponível. Enfileirando evento "${eventName}" para envio posterior.`);
    
    // Adicionar evento à fila de pendentes
    queueEvent(eventName, params, uniqueIdentifier);
    
    // Marcar evento como enviado mesmo assim para evitar duplicatas
    // O sistema de fila já tem sua própria deduplicação
    if (uniqueIdentifier) {
      markEventAsSent(eventName, uniqueIdentifier);
    } else {
      markEventAsSent(eventName);
    }
    
    return;
  }

  console.log(`GA4 Event: Enviando evento "${eventName}" com parâmetros:`, params);
  try {
    // Agora o TypeScript reconhece gtag
    (window as any).gtag('event', eventName, params);

    // Marca o evento como enviado após o sucesso
    if (uniqueIdentifier) {
      markEventAsSent(eventName, uniqueIdentifier);
    } else {
      markEventAsSent(eventName);
    }

  } catch (error) {
    console.error(`GA4 Event: Erro ao enviar evento "${eventName}":`, error);
  }
};

/**
 * Tenta obter o client_id do GA4 do cookie ou via API gtag.
 * @returns {Promise<string | null>}
 */
const getClientId = (): Promise<string | null> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || typeof (window as any).gtag !== 'function') {
            resolve(null);
            return;
        }
        try {
            // Tenta obter diretamente
            (window as any).gtag('get', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID, 'client_id', (clientId: string) => {
                if (clientId) {
                    resolve(clientId);
                } else {
                    // Tenta via cookie como fallback (nome comum, pode variar)
                    const match = document.cookie.match(/_ga=([^;]+)/);
                    const clientIdFromCookie = match ? match[1].split('.').slice(-2).join(".") : null;
                    resolve(clientIdFromCookie);
                }
            });
        } catch (error) {
            console.error('GA4 Event: Erro ao obter client_id:', error);
            resolve(null);
        }
    });
};

/**
 * Envia um evento para o Google Analytics via Measurement Protocol (lado do servidor).
 * Obtém o client_id no cliente e chama a nossa API interna.
 *
 * @param {Omit<MPEventData, 'client_id'>} data Dados do evento a serem enviados (sem client_id).
 * @returns {Promise<void>}
 */
export const sendMeasurementProtocolEvent = async (data: Omit<MPEventData, 'client_id'>): Promise<void> => {
  const clientId = await getClientId();

  if (!clientId) {
      console.warn('GA4 MP Event: Não foi possível obter o client_id. Evento não enviado.');
      return;
  }

  const eventData: MPEventData = {
      ...data,
      client_id: clientId,
  };

  // Não envia se não tiver eventos
  if (!eventData.events || eventData.events.length === 0) {
    console.warn('GA4 MP Event: Dados inválidos para envio (eventos ausentes).');
    return;
  }

  // Adiciona timestamp a todos os eventos se não existir
  const now = Date.now();
  eventData.events = eventData.events.map(event => ({
    ...event,
    params: {
      ...event.params,
      engagement_time_msec: '1', // Necessário para marcar como evento ativo
      // session_id será adicionado pelo GA4
      timestamp_micros: (now * 1000).toString(), // MP espera microssegundos
    }
  }));

  console.log('GA4 MP Event: Enviando dados para endpoint:', GA4_MP_ENDPOINT, eventData);

  try {
    const response = await fetch(GA4_MP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`GA4 MP Event: Erro ${response.status} ao enviar evento:`, errorBody);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    console.log('GA4 MP Event: Evento enviado com sucesso via API interna.');

  } catch (error) {
    console.error('GA4 MP Event: Falha ao enviar evento via Measurement Protocol (API interna):', error);
    // Implementar retry logic se necessário
  }
}; 