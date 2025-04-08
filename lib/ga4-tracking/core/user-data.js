"use client";

import { logger, LogCategory } from './logger';

/**
 * Armazena o ID do usuário atual para o GA4
 * @type {string|null}
 */
let currentUserId = null;

/**
 * Armazena as propriedades de usuário atuais para o GA4
 * @type {Object}
 */
let currentUserProperties = {};

/**
 * Define o ID do usuário para o GA4
 * @param {string} userId - ID do usuário (não deve conter informações pessoalmente identificáveis)
 */
export function setUserId(userId) {
  if (typeof window === 'undefined') return;
  
  logger.info(LogCategory.USER, 'Definindo User ID para GA4', { userId });
  currentUserId = userId;
  
  // Configurar o User ID no gtag
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID, {
      user_id: userId
    });
  }
}

/**
 * Obtém o ID de usuário atual
 * @returns {string|null} User ID ou null se não definido
 */
export function getUserId() {
  return currentUserId;
}

/**
 * Define uma propriedade de usuário para o GA4
 * @param {string} propertyName - Nome da propriedade
 * @param {any} value - Valor da propriedade
 */
export function setUserProperty(propertyName, value) {
  if (typeof window === 'undefined') return;
  if (!propertyName) return;
  
  // Verificar nomes reservados
  const reservedPrefixes = ['google_', 'ga_', 'firebase_'];
  const reservedNames = ['first_open_time', 'first_visit_time', 'last_deep_link_referrer', 'user_id', 'first_open_after_install'];
  
  if (reservedNames.includes(propertyName) || 
      reservedPrefixes.some(prefix => propertyName.startsWith(prefix))) {
    logger.warn(LogCategory.USER, `Propriedade de usuário com nome reservado ignorada: ${propertyName}`);
    return;
  }
  
  logger.info(LogCategory.USER, `Definindo propriedade de usuário GA4: ${propertyName}`, { value });
  
  // Armazenar localmente
  currentUserProperties[propertyName] = value;
  
  // Enviar para o GA4 via gtag
  if (window.gtag) {
    window.gtag('set', 'user_properties', {
      [propertyName]: value
    });
  }
}

/**
 * Define múltiplas propriedades de usuário para o GA4
 * @param {Object} properties - Objeto com propriedades do usuário
 */
export function setUserProperties(properties) {
  if (!properties || typeof properties !== 'object') return;
  
  Object.entries(properties).forEach(([name, value]) => {
    setUserProperty(name, value);
  });
}

/**
 * Obtém todas as propriedades do usuário atuais
 * @returns {Object} Propriedades do usuário
 */
export function getUserProperties() {
  return { ...currentUserProperties };
}

/**
 * Prepara e formata as propriedades do usuário para o Measurement Protocol
 * @returns {Object|null} Objeto formatado para o Measurement Protocol ou null se não houver propriedades
 */
export function prepareUserPropertiesForMP() {
  const properties = getUserProperties();
  
  if (Object.keys(properties).length === 0) {
    return null;
  }
  
  const formattedProperties = {};
  
  Object.entries(properties).forEach(([name, value]) => {
    formattedProperties[name] = {
      value
    };
  });
  
  return formattedProperties;
}

/**
 * Limpa todos os dados do usuário armazenados
 */
export function clearUserData() {
  currentUserId = null;
  currentUserProperties = {};
  
  logger.info(LogCategory.USER, 'Dados do usuário GA4 limpos');
} 