"use client";

import { logger, LogCategory } from './logger';
import { getConfig } from '../config';

/**
 * Verifica se o GA4 já está inicializado
 * @returns {boolean} True se o GA4 já estiver inicializado
 */
export function isGA4Initialized() {
  if (typeof window === 'undefined') return false;
  
  return typeof window.gtag === 'function';
}

/**
 * Inicializa o Google Analytics 4
 * @param {string} measurementId - ID de Medição do GA4 (opcional, usa o valor das variáveis de ambiente se não fornecido)
 * @returns {Object} Objeto com informações de inicialização
 */
export function initializeGA4(measurementId) {
  if (typeof window === 'undefined') {
    return { isInitialized: false, reason: 'Não está no ambiente do cliente' };
  }
  
  if (isGA4Initialized()) {
    logger.info(LogCategory.INIT, 'GA4 já inicializado');
    return { isInitialized: true, reason: 'Já inicializado' };
  }
  
  const config = getConfig();
  const gaId = measurementId || config.MEASUREMENT_ID;
  
  if (!gaId) {
    logger.error(LogCategory.INIT, 'GA4 Measurement ID não configurado');
    return { isInitialized: false, reason: 'Faltando GA4 Measurement ID' };
  }
  
  try {
    logger.info(LogCategory.INIT, 'Inicializando Google Analytics 4', { measurementId: gaId });
    
    // Adicionar script do GA4
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    
    gtag('js', new Date());
    
    // Configuração inicial
    gtag('config', gaId, {
      send_page_view: false // Importante: desativamos o pageview automático para controlar quando enviar
    });
    
    logger.info(LogCategory.INIT, 'GA4 inicializado com sucesso');
    
    // Carregar o script do GA4
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);
    
    return { isInitialized: true };
  } catch (error) {
    logger.error(LogCategory.INIT, 'Erro ao inicializar GA4', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return { isInitialized: false, reason: 'Erro na inicialização', error };
  }
} 