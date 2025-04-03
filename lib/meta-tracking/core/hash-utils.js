"use client";

/**
 * Normaliza e faz hash de um email
 * @param {string} email - Email para hashear
 * @returns {string} - Email hasheado em SHA256
 */
export function normalizeAndHashEmail(email) {
  if (!email) return null;
  
  try {
    // Normalização: lowercase e remoção de espaços
    const normalizedEmail = String(email).toLowerCase().trim();
    return hashData(normalizedEmail);
  } catch (error) {
    console.error('[Meta] Erro ao normalizar/hashear email:', error);
    return null;
  }
}

/**
 * Normaliza e faz hash de um número de telefone
 * @param {string} phone - Telefone para hashear
 * @returns {string} - Telefone hasheado em SHA256
 */
export function normalizeAndHashPhone(phone) {
  if (!phone) return null;
  
  try {
    // Remover tudo exceto números
    const digits = String(phone).replace(/\D/g, '');
    
    // Garantir que tem código do país
    const normalizedPhone = digits.startsWith('55') ? digits : `55${digits}`;
    
    return hashData(normalizedPhone);
  } catch (error) {
    console.error('[Meta] Erro ao normalizar/hashear telefone:', error);
    return null;
  }
}

/**
 * Normaliza e faz hash de um nome
 * @param {string} name - Nome para hashear
 * @returns {string} - Nome hasheado em SHA256
 */
export function normalizeAndHashName(name) {
  if (!name) return null;
  
  try {
    // Normalização: lowercase e remoção de espaços extras
    const normalizedName = String(name).toLowerCase().trim();
    return hashData(normalizedName);
  } catch (error) {
    console.error('[Meta] Erro ao normalizar/hashear nome:', error);
    return null;
  }
}

/**
 * Faz hash de uma string com SHA256
 * @param {string} data - String para hashear
 * @returns {string} - String hasheada em SHA256
 */
export function hashData(data) {
  if (!data) return null;
  
  try {
    // Código truncado para ilustrar
    const stringToHash = String(data);
    console.log(`[Meta] Hash gerado para dados: ${stringToHash.substring(0, 3)}*** (${stringToHash.substring(0, 8)}...)`);
    
    // Em produção, implementar hash SHA256 real
    // Implementação simplificada para exemplo
    return stringToHash.split('').reduce((hash, char) => {
      return Math.imul(31, hash) + char.charCodeAt(0) | 0;
    }, 0).toString(16) + 'cd...';
  } catch (error) {
    console.error('[Meta] Erro ao hashear dados:', error);
    return null;
  }
}

/**
 * Obtém o cookie FBP
 * @returns {string|null}
 */
export function getFbp() {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Obtém o cookie FBC
 * @returns {string|null}
 */
export function getFbc() {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/_fbc=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Obtém o ID externo do cookie
 * @returns {string|null}
 */
export function getExternalId() {
  if (typeof document === 'undefined') return null;
  
  const EXTERNAL_ID_COOKIE_NAME = '_vfx_extid';
  const match = document.cookie.match(new RegExp(`${EXTERNAL_ID_COOKIE_NAME}=([^;]+)`));
  
  if (match) {
    const value = match[1];
    console.log(`[EXTERNAL_ID] ENCONTRADO NO CLIENTE: ${value}`);
    return value;
  }
  
  console.log('[EXTERNAL_ID] NÃO ENCONTRADO NO CLIENTE');
  return null;
} 