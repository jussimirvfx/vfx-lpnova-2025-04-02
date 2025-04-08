/**
 * Implementação do evento contact do GA4
 * Equivalente ao evento Contact do Meta
 */

import { getClientId } from "../core/ga4-client";
import { GA4_CONFIG } from "../config/ga4-config";
import { sendToMeasurementProtocol } from "../api/measurement-protocol";

interface ContactData {
  method?: string;
  form_name?: string;
  page?: string;
  [key: string]: any;
}

/**
 * Rastrear evento contact no GA4 (lado do cliente)
 */
export async function trackContactEvent(
  contactData: ContactData,
  formName: string = 'WhatsApp'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const clientId = getClientId();
    if (!clientId) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id não disponível para contact`);
      return false;
    }
    
    // Preparar os parâmetros do evento
    const eventParams = {
      item_name: formName,
      item_category: contactData.method || 'WhatsApp',
      form_status: 'submitted',
      page_location: window.location.href,
      page_path: window.location.pathname,
      client_id: clientId,
    };
    
    // Log para debugging
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Enviando contact:`, {
        formName,
        method: contactData.method,
        path: window.location.pathname,
      });
    }
    
    // Enviar evento via gtag
    if (window.gtag) {
      window.gtag('event', 'contact', eventParams);
    }
    
    // Enviar via Measurement Protocol
    await sendToMeasurementProtocol('contact', eventParams);
    
    return true;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar contact:`, error);
    return false;
  }
}

/**
 * Versão da função para uso no servidor
 */
export async function trackContactServerSide(
  contactData: ContactData,
  formName: string = 'WhatsApp',
  clientId: string,
  pageUrl: string = '',
  pagePath: string = ''
): Promise<boolean> {
  try {
    if (!clientId) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id é obrigatório para contact no servidor`);
      return false;
    }
    
    // Preparar os parâmetros do evento
    const eventParams = {
      item_name: formName,
      item_category: contactData.method || 'WhatsApp',
      form_status: 'submitted',
      page_location: pageUrl,
      page_path: pagePath,
      client_id: clientId,
    };
    
    // Enviar via Measurement Protocol
    await sendToMeasurementProtocol('contact', eventParams);
    
    return true;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar contact no servidor:`, error);
    return false;
  }
} 