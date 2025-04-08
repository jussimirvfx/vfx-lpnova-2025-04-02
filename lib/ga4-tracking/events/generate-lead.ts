/**
 * Implementação do evento generate_lead do GA4
 * Equivalente ao evento Lead do Meta
 */

import { getClientId } from "../core/ga4-client";
import { GA4_CONFIG } from "../config/ga4-config";
import { sendToMeasurementProtocol } from "../api/measurement-protocol";

interface LeadData {
  email?: string;
  phone?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Função para calcular o valor do lead com base no score
 * Reutiliza a mesma lógica do Meta para consistência
 */
function calculateLeadValue(leadData: LeadData, score: number, isQualified: boolean): number {
  if (!isQualified) return 0;
  
  // Usar a mesma função de pontuação do Meta
  return score;
}

/**
 * Rastrear evento generate_lead no GA4 (lado do cliente)
 */
export async function trackGenerateLeadEvent(
  leadData: LeadData,
  score: number,
  isQualified: boolean,
  formName: string = 'default'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const clientId = getClientId();
    if (!clientId) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id não disponível para generate_lead`);
      return false;
    }
    
    // Calcular o valor do lead
    const leadValue = calculateLeadValue(leadData, score, isQualified);
    
    // Preparar os parâmetros do evento
    const eventParams = {
      lead_value: leadValue,
      currency_code: 'BRL',
      item_name: formName,
      qualification_status: isQualified ? 'qualified' : 'unqualified',
      // Não incluir dados sensíveis nos parâmetros
      form_status: 'submitted',
      client_id: clientId,
    };
    
    // Log para debugging
    if (GA4_CONFIG.LOGGING.ENABLED) {
      console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Enviando generate_lead:`, {
        isQualified,
        score,
        leadValue,
        formName,
      });
    }
    
    // Enviar evento via gtag
    if (window.gtag) {
      window.gtag('event', 'generate_lead', eventParams);
    }
    
    // Enviar via Measurement Protocol
    await sendToMeasurementProtocol('generate_lead', eventParams);
    
    // Verificar se o lead é qualificado para enviar sign_up também
    if (isQualified) {
      // Enviar evento sign_up para leads qualificados
      if (window.gtag) {
        window.gtag('event', 'sign_up', {
          value: leadValue,
          currency_code: 'BRL',
          item_name: formName,
          client_id: clientId,
        });
      }
      
      // Enviar sign_up via Measurement Protocol
      await sendToMeasurementProtocol('sign_up', {
        value: leadValue,
        currency_code: 'BRL',
        item_name: formName,
        client_id: clientId,
      });
      
      if (GA4_CONFIG.LOGGING.ENABLED) {
        console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Lead qualificado, enviando sign_up também`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar generate_lead:`, error);
    return false;
  }
}

/**
 * Versão da função para uso no servidor
 */
export async function trackGenerateLeadServerSide(
  leadData: LeadData,
  score: number,
  isQualified: boolean,
  formName: string = 'default',
  clientId: string
): Promise<boolean> {
  try {
    if (!clientId) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] client_id é obrigatório para generate_lead no servidor`);
      return false;
    }
    
    // Calcular o valor do lead
    const leadValue = calculateLeadValue(leadData, score, isQualified);
    
    // Preparar os parâmetros do evento
    const eventParams = {
      lead_value: leadValue,
      currency_code: 'BRL',
      item_name: formName,
      qualification_status: isQualified ? 'qualified' : 'unqualified',
      form_status: 'submitted',
      client_id: clientId,
    };
    
    // Enviar via Measurement Protocol
    await sendToMeasurementProtocol('generate_lead', eventParams);
    
    // Verificar se o lead é qualificado para enviar sign_up também
    if (isQualified) {
      // Enviar sign_up via Measurement Protocol
      await sendToMeasurementProtocol('sign_up', {
        value: leadValue,
        currency_code: 'BRL',
        item_name: formName,
        client_id: clientId,
      });
    }
    
    return true;
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] Erro ao enviar generate_lead no servidor:`, error);
    return false;
  }
} 