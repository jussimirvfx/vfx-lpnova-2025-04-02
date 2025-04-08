"use client";

import { logger, LogCategory } from '../core/logger';

/**
 * Obtém as configurações do GA4 para o lado do cliente
 * @returns {Object} Configurações do GA4
 */
export function getConfig() {
  // Verificar configurações
  const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  
  // Diagnóstico básico
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!MEASUREMENT_ID) {
      console.warn('[GA4] NEXT_PUBLIC_GA4_MEASUREMENT_ID não configurado');
    }
  }
  
  return {
    MEASUREMENT_ID
  };
}

/**
 * Obtém as configurações do GA4 para o lado do servidor (API Routes)
 * @returns {Object} Configurações do GA4 para o servidor
 */
export function getServerConfig() {
  // Verificar configurações
  const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
  const API_SECRET = process.env.GA4_API_SECRET || '';
  
  // Diagnóstico detalhado para o servidor
  if (process.env.NODE_ENV === 'development') {
    const warnings = [];
    
    if (!MEASUREMENT_ID) {
      warnings.push('NEXT_PUBLIC_GA4_MEASUREMENT_ID não configurado');
    }
    
    if (!API_SECRET) {
      warnings.push('GA4_API_SECRET não configurado - API de Medição não funcionará');
    }
    
    if (warnings.length > 0) {
      console.warn('[GA4] Avisos de configuração do servidor:', warnings.join(', '));
    }
  }
  
  return {
    MEASUREMENT_ID,
    API_SECRET
  };
} 