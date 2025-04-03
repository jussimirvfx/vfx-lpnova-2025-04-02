"use client";

import { logger, LogCategory } from './logger';

/**
 * Inicializa o sistema de rastreamento do Meta Pixel
 * @param {string} pixelId - ID do Meta Pixel
 * @param {Object} options - Opções de inicialização
 * @returns {Object} - Resultado da inicialização
 */
export function initializeMetaPixel(pixelId, options = {}) {
  if (typeof window === 'undefined') {
    return { isInitialized: false, error: 'Ambiente de servidor não suportado' };
  }
  
  if (!pixelId) {
    logger.error(LogCategory.INIT, 'Não foi possível inicializar: Pixel ID não fornecido');
    return { isInitialized: false, error: 'Pixel ID não fornecido' };
  }
  
  // Verifique se já inicializado
  if (isPixelInitialized()) {
    logger.info(LogCategory.INIT, 'Meta Pixel já inicializado, ignorando', { pixelId });
    return { isInitialized: true, pixelId };
  }
  
  try {
    // Adicionar proteção contra PageView automático
    adicionarScriptProtecao();
    
    // Inicialização do fbq
    initializeFbq(pixelId, options);
    
    logger.info(LogCategory.INIT, 'Meta Pixel inicializado com sucesso', { 
      pixelId, 
      timestamp: Date.now() 
    });
    
    return { isInitialized: true, pixelId };
  } catch (error) {
    logger.error(LogCategory.INIT, 'Erro ao inicializar Meta Pixel', { 
      error: error instanceof Error ? error.message : String(error),
      pixelId
    });
    
    return { isInitialized: false, error };
  }
}

/**
 * Adiciona script de proteção contra PageView automático
 */
function adicionarScriptProtecao() {
  if (typeof window === 'undefined') return;
  if (window._fbPixelProtected) return;
  
  logger.debug(LogCategory.INIT, 'Adicionando proteção contra PageView automático');
  
  // Criar script de proteção
  const script = document.createElement('script');
  script.innerHTML = `
    // Proteção contra PageView automático
    (function() {
      window._fbq_calls = [];
      window.fbq = function() {
        var args = Array.prototype.slice.call(arguments);
        if (args[0] === 'track' && args[1] === 'PageView' && (!args[3] || !args[3].eventID)) {
          console.warn('[Meta Pixel] Bloqueado PageView automático');
          return;
        }
        window._fbq_calls.push(args);
      };
      window._fbPixelProtected = true;
    })();
  `;
  
  const head = document.getElementsByTagName('head')[0];
  head.insertBefore(script, head.firstChild);
  
  logger.debug(LogCategory.INIT, 'Proteção contra PageView automático adicionada');
}

/**
 * Inicializa o objeto fbq e carrega o script do Facebook
 * @param {string} pixelId - ID do Meta Pixel
 * @param {Object} options - Opções de inicialização
 */
function initializeFbq(pixelId, options) {
  if (typeof window === "undefined") return;
  
  // Verificar se já inicializado
  if (window._fbPixelInitialized) {
    logger.info(LogCategory.INIT, 'Meta Pixel já inicializado, ignorando', { pixelId });
    return;
  }

  logger.info(LogCategory.INIT, 'Iniciando inicialização do Meta Pixel', { 
    pixelId, 
    timestamp: Date.now() 
  });

  // Inicializar o pixel
  const fbq = function(...args) {
    // Interceptar PageView automático
    if (args[0] === 'track' && args[1] === 'PageView' && (!args[3] || !args[3].eventID)) {
      logger.warn(LogCategory.INIT, 'Bloqueando PageView automático na inicialização');
      return;
    }
    
    fbq.callMethod ? 
      fbq.callMethod.apply(fbq, args) : 
      fbq.queue.push(args);
  };

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  
  window.fbq = fbq;
  
  // Processar chamadas interceptadas
  if (window._fbq_calls && Array.isArray(window._fbq_calls)) {
    window._fbq_calls.forEach(args => {
      if (args[0] === 'track' && args[1] === 'PageView' && (!args[3] || !args[3].eventID)) {
        logger.warn(LogCategory.INIT, 'Bloqueando PageView automático na fila');
      } else {
        fbq.apply(null, args);
      }
    });
    window._fbq_calls = [];
  }

  // Carregar script
  const script = document.createElement("script");
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.async = true;
  
  script.onload = () => {
    logger.info(LogCategory.INIT, 'Script do Facebook carregado com sucesso');
  };
  
  document.head.appendChild(script);

  // Inicializar o pixel
  logger.info(LogCategory.INIT, `Chamando fbq('init', '${pixelId}')`, options);
  window.fbq("init", pixelId, options);
  
  window._fbPixelInitialized = true;
  logger.info(LogCategory.INIT, 'Meta Pixel inicializado com sucesso', { pixelId });
}

/**
 * Verifica se o Meta Pixel foi inicializado
 * @returns {boolean} - Se o pixel está inicializado
 */
export function isPixelInitialized() {
  if (typeof window === 'undefined') return false;
  return !!(window.fbq && (window.fbq.loaded === true || window._fbPixelInitialized === true));
} 