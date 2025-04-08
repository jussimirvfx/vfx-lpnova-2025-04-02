"use client";

import { logger, LogCategory } from '../core/logger';

/**
 * Obtém as configurações do GA4 para o lado do cliente
 * @returns {Object} Configurações do GA4
 */
export function getConfig() {
  // Verificar configurações
  const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  
  // Diagnóstico detalhado
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Verificar se as variáveis essenciais estão definidas
    const hasMeasurementId = !!MEASUREMENT_ID;
    
    if (!hasMeasurementId) {
      // Exibir aviso mais visível
      console.warn('==================== AVISO: VARIÁVEL DE AMBIENTE GA4 NÃO CONFIGURADA ====================');
      console.warn('A seguinte variável de ambiente deve ser configurada no seu .env.local:');
      console.warn('- NEXT_PUBLIC_GA4_MEASUREMENT_ID (valor: não definido)');
      console.warn('===================================================================');
    } else {
      console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 (CLIENTE) ====================');
      console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID:', {
        value: MEASUREMENT_ID,
        exists: true
      });
      console.log('===================================================================');
    }
  }
  
  // Verificação para produção (feedback mínimo)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !MEASUREMENT_ID) {
    console.warn('[GA4] Measurement ID não configurado. O rastreamento do GA4 não funcionará.');
  }
  
  return {
    MEASUREMENT_ID,
    DEBUG_MODE: process.env.NODE_ENV === 'development'
  };
}

/**
 * Obtém as configurações do GA4 para o lado do servidor (API Routes)
 * @returns {Object} Configurações do GA4 para o servidor
 */
export function getServerConfig() {
  // Verificar configurações
  const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || process.env.GA4_MEASUREMENT_ID || '';
  const API_SECRET = process.env.GA4_API_SECRET || '';
  
  // Diagnóstico detalhado para o servidor
  if (process.env.NODE_ENV === 'development') {
    // Verificar se as variáveis essenciais estão definidas
    const hasMeasurementId = !!MEASUREMENT_ID;
    const hasApiSecret = !!API_SECRET;
    
    const warnings = [];
    
    if (!hasMeasurementId) {
      warnings.push('NEXT_PUBLIC_GA4_MEASUREMENT_ID ou GA4_MEASUREMENT_ID não configurado');
    }
    
    if (!hasApiSecret) {
      warnings.push('GA4_API_SECRET não configurado - API de Medição não funcionará');
    }
    
    if (warnings.length > 0) {
      console.warn('==================== AVISOS DE CONFIGURAÇÃO GA4 (SERVIDOR) ====================');
      warnings.forEach(warning => console.warn(`- ${warning}`));
      console.warn('=====================================================================');
    } else {
      console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 (SERVIDOR) ====================');
      console.log('MEASUREMENT_ID:', {
        value: MEASUREMENT_ID,
        exists: true
      });
      console.log('API_SECRET:', {
        value: `${API_SECRET.substring(0, 3)}...${API_SECRET.substring(API_SECRET.length - 3)}`,
        exists: true
      });
      console.log('=====================================================================');
    }
  }
  
  return {
    MEASUREMENT_ID,
    API_SECRET,
    DEBUG_MODE: process.env.NODE_ENV === 'development'
  };
} 