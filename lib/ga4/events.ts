import { hasEventBeenSent, markEventAsSent } from './storage';

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

// Valor máximo de retentativas para eventos importantes
const MAX_RETRIES = 3;
// Tempo de espera entre as tentativas (em ms)
const RETRY_DELAY = 1000;
// Lista de eventos considerados críticos (que terão retry)
const CRITICAL_EVENTS = ['generate_lead', 'QualifiedLead', 'contact', 'view_item'];

/**
 * Verifica se o Google Analytics (gtag) está disponível
 * @returns {boolean} true se o gtag estiver disponível
 */
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
};

/**
 * Tenta novamente enviar um evento após um atraso
 * @param {Function} fn Função a ser executada após o atraso
 * @param {number} delay Tempo de espera em ms
 * @returns {number} ID do timeout para possível cancelamento
 */
const retry = (fn: () => void, delay: number): number => {
  return window.setTimeout(fn, delay);
};

/**
 * Envia um evento para o Google Analytics 4 usando gtag (lado do cliente).
 * Inclui verificação de duplicatas antes de enviar e mecanismo de retry.
 *
 * @param {string} eventName Nome do evento GA4 (ex: 'generate_lead').
 * @param {EventParams} params Parâmetros adicionais do evento.
 * @param {string} [uniqueIdentifier] Identificador único para deduplicação (ex: ID do formulário, URL da página).
 * @param {number} [retryCount=0] Contador de tentativas (usado internamente para retry)
 */
export const sendGA4Event = (
  eventName: string, 
  params: EventParams = {}, 
  uniqueIdentifier?: string,
  retryCount: number = 0
): void => {
  // Verifica se o evento já foi enviado para este identificador
  if (uniqueIdentifier && hasEventBeenSent(eventName, uniqueIdentifier)) {
    console.log(`GA4 Event: Evento "${eventName}" com ID "${uniqueIdentifier}" já enviado. Prevenindo duplicata.`);
    return;
  }
  if (!uniqueIdentifier && hasEventBeenSent(eventName)) {
     console.log(`GA4 Event: Evento "${eventName}" já enviado. Prevenindo duplicata.`);
     return;
  }

  // Verifica se o gtag está disponível
  if (!isGtagAvailable()) {
    // Para eventos críticos, tentamos novamente
    const isCriticalEvent = CRITICAL_EVENTS.includes(eventName);
    if (isCriticalEvent && retryCount < MAX_RETRIES) {
      console.log(`GA4 Event: gtag não disponível. Tentando novamente (${retryCount + 1}/${MAX_RETRIES}) para o evento "${eventName}" em ${RETRY_DELAY}ms.`);
      retry(() => sendGA4Event(eventName, params, uniqueIdentifier, retryCount + 1), RETRY_DELAY);
      return;
    }

    // Se esgotou as tentativas ou não é evento crítico, usa o fallback via Measurement Protocol
    console.warn(`GA4 Event: gtag não disponível após ${retryCount} tentativas. Usando fallback via Measurement Protocol para "${eventName}".`);
    
    // Enviar via Measurement Protocol como fallback
    sendMeasurementProtocolEvent({
      events: [{
        name: eventName,
        params: params
      }]
    });
    
    // Mesmo sem o gtag, marcamos o evento como enviado para evitar duplicatas
    if (uniqueIdentifier) {
      markEventAsSent(eventName, uniqueIdentifier);
    } else {
      markEventAsSent(eventName);
    }
    
    return;
  }

  console.log(`GA4 Event: Enviando evento "${eventName}" com parâmetros:`, params);
  try {
    // Usando um try para garantir que erros não irão interromper a execução
    (window as any).gtag('event', eventName, params);

    // Marca o evento como enviado após o sucesso
    if (uniqueIdentifier) {
        markEventAsSent(eventName, uniqueIdentifier);
    } else {
        markEventAsSent(eventName);
    }

    console.log(`GA4 Event: Evento "${eventName}" enviado com sucesso via gtag.`);
  } catch (error) {
    console.error(`GA4 Event: Erro ao enviar evento "${eventName}" via gtag:`, error);
    
    // Em caso de erro, tenta enviar via Measurement Protocol
    console.log(`GA4 Event: Tentando fallback via Measurement Protocol para "${eventName}".`);
    sendMeasurementProtocolEvent({
      events: [{
        name: eventName,
        params: params
      }]
    });
  }
};

/**
 * Tenta obter o client_id do GA4 do cookie ou via geração de um ID
 * @returns {Promise<string>} - Sempre retorna um client_id válido, mesmo que seja gerado
 */
const getClientId = (): Promise<string> => {
    return new Promise((resolve) => {
        // Se gtag estiver disponível, tenta obter o client_id via API
        if (isGtagAvailable()) {
            try {
                (window as any).gtag('get', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID, 'client_id', (clientId: string) => {
                    if (clientId) {
                        resolve(clientId);
                        return;
                    }
                    fallbackClientId();
                });
            } catch (error) {
                console.error('GA4 Event: Erro ao obter client_id via gtag:', error);
                fallbackClientId();
            }
        } else {
            fallbackClientId();
        }

        // Função para obter client_id via fallbacks
        function fallbackClientId() {
            // Tenta via cookie como primeira alternativa
            try {
                const match = document.cookie.match(/_ga=([^;]+)/);
                if (match) {
                    const clientIdFromCookie = match[1].split('.').slice(-2).join(".");
                    if (clientIdFromCookie) {
                        resolve(clientIdFromCookie);
                        return;
                    }
                }
            } catch (e) {
                console.warn('GA4 Event: Erro ao extrair client_id do cookie:', e);
            }

            // Última alternativa: gerar um UUID v4 aleatório
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            
            console.log('GA4 Event: Gerado client_id alternativo:', uuid);
            resolve(uuid);
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
  // Sempre obter um client_id, mesmo que seja gerado
  const clientId = await getClientId();

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

  console.log('GA4 MP Event: Enviando dados para endpoint:', GA4_MP_ENDPOINT);

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
    // Aqui poderíamos implementar mais retries se necessário
  }
}; 