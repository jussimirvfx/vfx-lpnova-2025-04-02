"use client";

import { logger, LogCategory } from './logger';

/**
 * Coleta dados universais da página atual para eventos do Meta Pixel
 * @returns {Object} Dados coletados
 */
export function collectPageData() {
  if (typeof window === 'undefined') {
    return {
      page_title: '',
      page_path: '',
      page_url: '',
      referrer: ''
    };
  }
  
  try {
    logger.debug(LogCategory.DATA, 'Coletando dados universais da página');
    
    const data = {
      page_title: document.title,
      page_path: window.location.pathname,
      page_url: window.location.href,
      referrer: document.referrer || '',
      // Dados adicionais
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      language: navigator.language || '',
      timestamp: Date.now()
    };
    
    logger.debug(LogCategory.DATA, 'Dados coletados com sucesso', data);
    
    return data;
  } catch (error) {
    logger.error(LogCategory.DATA, 'Erro ao coletar dados da página', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Retornar o mínimo de dados
    return {
      page_title: document.title || '',
      page_path: window.location.pathname || '',
      page_url: window.location.href || '',
      referrer: document.referrer || ''
    };
  }
}

/**
 * Coleta dados do usuário para eventos do Meta Pixel
 * @param {Object} additionalUserData - Dados adicionais do usuário
 * @returns {Object} Dados do usuário
 */
export function collectUserData(additionalUserData = {}) {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    logger.debug(LogCategory.DATA, 'Coletando dados do usuário');
    
    // Dados base do usuário
    const userData = {
      client_user_agent: navigator.userAgent,
      ...additionalUserData
    };
    
    logger.debug(LogCategory.DATA, 'Dados do usuário coletados', {
      fields: Object.keys(userData),
      hasExtra: Object.keys(additionalUserData).length > 0
    });
    
    return userData;
  } catch (error) {
    logger.error(LogCategory.DATA, 'Erro ao coletar dados do usuário', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {};
  }
} 