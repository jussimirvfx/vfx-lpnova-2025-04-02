"use client";

/**
 * Coleta dados da página atual
 * @returns {Object} Dados da página
 */
export function collectPageData() {
  if (typeof window === 'undefined') return {};
  
  return {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    page_referrer: document.referrer || "",
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language || ""
  };
}

/**
 * Coleta informações básicas do usuário
 * @param {Object} additionalData - Dados adicionais para incluir
 * @returns {Object} Dados do usuário
 */
export function collectUserData(additionalData = {}) {
  const userData = {
    ...additionalData
  };
  
  if (typeof window !== 'undefined') {
    // Adicionar User Agent 
    userData.user_agent = navigator.userAgent;
    
    // Identificar cliente via client_id se disponível (cookie _ga)
    const clientId = getClientId();
    if (clientId) {
      userData.client_id = clientId;
    }
  }
  
  return userData;
}

/**
 * Obtém o client_id do GA do cookie _ga
 * @returns {string|null} Client ID do GA ou null se não encontrado
 */
export function getClientId() {
  if (typeof window === 'undefined' || !document.cookie) return null;
  
  const match = document.cookie.match(/_ga=(.+?)(;|$)/);
  if (match) {
    const gaCookie = match[1].split('.');
    // O client_id consiste nas duas últimas partes do cookie _ga (GA1.2.XXXXXXXXXX.YYYYYYYYYY)
    if (gaCookie.length >= 4) {
      return `${gaCookie[2]}.${gaCookie[3]}`;
    }
  }
  
  return null;
}

/**
 * Prepara os parâmetros para um evento GA4
 * @param {string} eventName - Nome do evento
 * @param {Object} eventParams - Parâmetros do evento 
 * @returns {Object} Objeto formatado para GA4
 */
export function prepareEventParameters(eventName, eventParams = {}) {
  // Garantir que não estamos modificando o objeto original
  const params = { ...eventParams };
  
  // Adicionar dados de página se não fornecidos
  if (!params.page_location && !params.page_path) {
    const pageData = collectPageData();
    
    // Adicionar dados da página ao evento
    Object.entries(pageData).forEach(([key, value]) => {
      if (!params[key]) {
        params[key] = value;
      }
    });
  }
  
  return params;
} 