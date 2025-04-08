/**
 * Implementação do GA4 Measurement Protocol
 * Responsável por enviar eventos para o GA4 a partir do servidor.
 */

import { GA4_CONFIG } from '../config/ga4-config';

/**
 * Função para enviar eventos para o GA4 Measurement Protocol
 * 
 * @param eventName Nome do evento (ex: 'page_view', 'generate_lead')
 * @param params Parâmetros do evento
 * @returns Promise com o resultado da requisição
 */
export async function sendToMeasurementProtocol(
  eventName: string,
  params: Record<string, any> = {}
): Promise<Response | null> {
  // Verificar se temos as configurações necessárias
  if (!GA4_CONFIG.MEASUREMENT_ID || !GA4_CONFIG.API_SECRET) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Configurações do Measurement Protocol incompletas`);
    return null;
  }
  
  try {
    // Obter parâmetros básicos
    const clientId = params.client_id || (typeof window !== 'undefined' ? window._ga4ClientId : null);
    
    if (!clientId) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id é obrigatório para o Measurement Protocol`);
      return null;
    }
    
    // Preparar o endpoint
    const endpoint = process.env.NODE_ENV === 'development' && GA4_CONFIG.LOGGING.ENABLED
      ? GA4_CONFIG.DEBUG_ENDPOINT
      : GA4_CONFIG.MEASUREMENT_PROTOCOL_ENDPOINT;
      
    const url = `${endpoint}?measurement_id=${GA4_CONFIG.MEASUREMENT_ID}&api_secret=${GA4_CONFIG.API_SECRET}`;
    
    // Remover parâmetros que não devem ser enviados
    const { client_id, send_to, ...eventParams } = params;
    
    // Preparar o payload
    const payload = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: {
            ...eventParams,
            engagement_time_msec: 100,
          }
        }
      ],
      timestamp_micros: Date.now() * 1000,
    };
    
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Enviando evento ${eventName} para MP:`, {
        url: endpoint.replace(GA4_CONFIG.API_SECRET, '***'),
        clientId: clientId.substring(0, 5) + '...',
        hasParams: Object.keys(eventParams).length > 0,
      });
    }
    
    // Enviar a requisição
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar evento para MP:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
    } else if (GA4_CONFIG.LOGGING.ENABLED) {
      const responseData = await response.text();
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Resposta MP para ${eventName}:`, responseData);
    }
    
    return response;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar evento para MP:`, error);
    return null;
  }
}

/**
 * Versão da função para uso no servidor/API
 * Esta função é usada em rotas de API no NextJS
 */
export async function sendServerSideEvent(
  eventName: string,
  params: Record<string, any> = {},
  clientId?: string
): Promise<Response | null> {
  if (!clientId) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id é obrigatório para eventos server-side`);
    return null;
  }
  
  return sendToMeasurementProtocol(eventName, {
    ...params,
    client_id: clientId,
  });
} 