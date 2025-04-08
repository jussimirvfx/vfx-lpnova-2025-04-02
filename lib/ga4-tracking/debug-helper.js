"use client";

/**
 * Ferramentas de diagnóstico para o rastreamento do GA4
 * Este módulo ajuda a diagnosticar problemas com o rastreamento do GA4
 */

/**
 * Verifica o status da configuração do GA4 e exibe um relatório no console
 * @returns {Object} Objeto com o status da configuração
 */
export function debugGA4Setup() {
  if (typeof window === 'undefined') {
    console.warn('[GA4 Debug] Ferramenta de diagnóstico só funciona no cliente');
    return { environment: 'server' };
  }
  
  console.group('[GA4] Diagnóstico de Configuração');
  
  // Verificar variáveis de ambiente
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID:', measurementId || '(não configurado)');
  
  // Verificar script do GA4
  const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  console.log('Script do GA4 no DOM:', gaScripts.length > 0 ? 'Encontrado' : 'Não encontrado');
  
  if (gaScripts.length > 0) {
    Array.from(gaScripts).forEach((script, index) => {
      console.log(`Script ${index + 1}:`, script.src);
    });
  }
  
  // Verificar função gtag
  const hasGtag = typeof window.gtag === 'function';
  console.log('Função gtag disponível:', hasGtag ? 'Sim' : 'Não');
  
  // Verificar dataLayer
  const hasDataLayer = Array.isArray(window.dataLayer);
  console.log('dataLayer inicializado:', hasDataLayer ? 'Sim' : 'Não');
  
  if (hasDataLayer) {
    console.log('Tamanho do dataLayer:', window.dataLayer.length);
    console.log('Primeiros 5 eventos do dataLayer:', window.dataLayer.slice(0, 5));
  }
  
  // Verificar cookies do GA
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const gaCookies = cookies.filter(cookie => cookie.startsWith('_ga'));
  
  console.log('Cookies do GA encontrados:', gaCookies.length);
  gaCookies.forEach(cookie => console.log(cookie));
  
  // Verificar localStorage
  let clientId = null;
  try {
    clientId = localStorage.getItem('ga_client_id');
    console.log('Client ID no localStorage:', clientId || '(não encontrado)');
  } catch (e) {
    console.log('Erro ao acessar localStorage:', e.message);
  }
  
  // Verificação adicional do Facebook Pixel para o gateway
  const hasFbq = typeof window.fbq === 'function';
  console.log('Meta Pixel (fbq) disponível:', hasFbq ? 'Sim' : 'Não');
  
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  console.log('NEXT_PUBLIC_FACEBOOK_PIXEL_ID:', pixelId || '(não configurado)');
  
  console.groupEnd();
  
  return {
    environment: 'client',
    ga4: {
      measurementId: measurementId || null,
      scriptLoaded: gaScripts.length > 0,
      gtagAvailable: hasGtag,
      dataLayerInitialized: hasDataLayer,
      dataLayerSize: hasDataLayer ? window.dataLayer.length : 0,
      clientId: clientId
    },
    meta: {
      pixelId: pixelId || null,
      fbqAvailable: hasFbq
    }
  };
}

/**
 * Monitora eventos do GA4 em tempo real
 * @param {boolean} enable - Se deve ativar ou desativar o monitoramento
 * @returns {Object} Objeto com informações do monitoramento
 */
export function monitorGA4Events(enable = true) {
  if (typeof window === 'undefined') {
    return { enabled: false, reason: 'server-side' };
  }
  
  if (enable) {
    // Já está monitorando?
    if (window._ga4Monitor) {
      console.log('[GA4] Monitoramento já ativo');
      return { enabled: true, status: 'already-active' };
    }
    
    // Verificar se o gtag existe
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4] gtag não disponível para monitoramento');
      return { enabled: false, reason: 'gtag-unavailable' };
    }
    
    // Criar contador de eventos
    window._ga4Monitor = {
      events: [],
      originalGtag: window.gtag,
      startTime: new Date(),
      count: 0
    };
    
    // Substituir o gtag por nossa versão
    window.gtag = function(...args) {
      // Registrar o evento para debug
      if (args[0] === 'event') {
        const eventName = args[1];
        const params = args[2] || {};
        const timestamp = new Date();
        
        window._ga4Monitor.count++;
        window._ga4Monitor.events.push({
          time: timestamp,
          name: eventName,
          params: { ...params }
        });
        
        console.log(`[GA4 Monitor] Evento #${window._ga4Monitor.count}: ${eventName}`, params);
      }
      
      // Passar para o gtag original
      return window._ga4Monitor.originalGtag.apply(this, args);
    };
    
    console.log('[GA4] Monitoramento ativado');
    return { enabled: true, status: 'enabled' };
  } else {
    // Desativar monitoramento
    if (!window._ga4Monitor) {
      return { enabled: false, status: 'not-active' };
    }
    
    // Restaurar gtag original
    window.gtag = window._ga4Monitor.originalGtag;
    
    // Exibir resumo
    console.group('[GA4] Resumo de Monitoramento');
    console.log('Total de eventos:', window._ga4Monitor.count);
    console.log('Período de monitoramento:', formatTimeElapsed(window._ga4Monitor.startTime, new Date()));
    console.log('Eventos capturados:', window._ga4Monitor.events);
    console.groupEnd();
    
    // Limpar monitor
    const summary = {
      eventsCount: window._ga4Monitor.count,
      startTime: window._ga4Monitor.startTime,
      endTime: new Date(),
      events: window._ga4Monitor.events
    };
    
    delete window._ga4Monitor;
    
    return { 
      enabled: false, 
      status: 'disabled',
      summary
    };
  }
}

/**
 * Formata o tempo decorrido entre duas datas
 * @param {Date} start - Data de início
 * @param {Date} end - Data de fim
 * @returns {string} Tempo formatado
 */
function formatTimeElapsed(start, end) {
  const diffMs = end - start;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Exibe instruções de diagnóstico no console
 */
export function showGA4DebugInstructions() {
  console.group('[GA4] Instruções de Diagnóstico');
  console.log('Para diagnosticar problemas com o GA4, você pode usar as seguintes funções:');
  console.log('');
  console.log('1. Verificar configuração:');
  console.log('   import { debugGA4Setup } from "@/lib/ga4-tracking/debug-helper";');
  console.log('   debugGA4Setup();');
  console.log('');
  console.log('2. Monitorar eventos em tempo real:');
  console.log('   import { monitorGA4Events } from "@/lib/ga4-tracking/debug-helper";');
  console.log('   // Iniciar monitoramento');
  console.log('   monitorGA4Events();');
  console.log('   // Parar e ver resumo');
  console.log('   monitorGA4Events(false);');
  console.log('');
  console.log('3. Use o Google Tag Assistant para verificar se os eventos estão sendo enviados:');
  console.log('   https://tagassistant.google.com/');
  console.groupEnd();
} 