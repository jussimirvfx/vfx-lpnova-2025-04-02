"use client";

import { logger, LogCategory } from './core/logger';
import { useCallback, useEffect, useRef } from 'react';
import { useGA4 } from './hooks/useGA4';
import { useMetaPixel } from '../meta-tracking/hooks/useMetaPixel';

/**
 * Mapeamento de propriedades do usuário do Meta para o GA4
 * Deixe um objeto vazio para não mapear nenhuma propriedade automaticamente
 */
const USER_PROPERTIES_MAP = {
  // Exemplo: mapear propriedades do Meta para o GA4
  // 'metaPropertyName': 'ga4PropertyName',
  'email': 'email',
  'phone': 'phone',
  'external_id': 'user_id',
};

/**
 * Hook para conectar eventos do Meta Pixel com o GA4
 * Este hook sobrescreve o método trackEvent do Meta Pixel para enviar 
 * os mesmos eventos também para o GA4
 */
export function useMetaGA4Gateway() {
  const ga4 = useGA4();
  const metaPixel = useMetaPixel();
  const originalFbq = useRef(null);
  const isInstalled = useRef(false);
  
  // Função para extrair e transmitir User ID e User Properties
  // com base nos dados do Meta Pixel ou do contexto da aplicação
  const syncUserDataToGA4 = useCallback((metaEventName, metaData = {}) => {
    // IMPORTANTE: Esta função deve ser personalizada de acordo com sua lógica
    // de negócios e como você armazena o User ID e User Properties.
    
    // Extrair user_id dos dados do evento
    if (metaData.user_id && typeof metaData.user_id === 'string') {
      ga4.setUserId(metaData.user_id);
      logger.debug(LogCategory.USER, 'User ID extraído do Meta e configurado no GA4', { userId: metaData.user_id });
    } else if (window._appUserContext && window._appUserContext.userId) {
      // Obter do contexto global (personalizar conforme necessário)
      ga4.setUserId(window._appUserContext.userId);
      logger.debug(LogCategory.USER, 'User ID obtido do contexto da aplicação e configurado no GA4');
    }
    
    // Mapear propriedades do usuário presentes no metaData para GA4
    const userProps = {};
    
    // Extração direta de propriedades configuradas no mapeamento
    Object.entries(USER_PROPERTIES_MAP).forEach(([metaProp, ga4Prop]) => {
      if (metaData[metaProp] !== undefined) {
        userProps[ga4Prop] = metaData[metaProp];
      }
    });
    
    // Obter dados da aplicação, como preferências do usuário
    if (window._appUserContext && window._appUserContext.preferences) {
      // Personalize conforme necessário com suas próprias propriedades
      if (window._appUserContext.preferences.language) {
        userProps.language_preference = window._appUserContext.preferences.language;
      }
      if (window._appUserContext.preferences.theme) {
        userProps.theme_preference = window._appUserContext.preferences.theme;
      }
    }
    
    // Enviar propriedades para o GA4 se houver alguma
    if (Object.keys(userProps).length > 0) {
      ga4.setUserProperties(userProps);
      logger.debug(LogCategory.USER, 'User Properties enviadas para o GA4', userProps);
    }
    
    return userProps;
  }, [ga4]);
  
  // Função para enviar eventos do Meta Pixel para o GA4
  const syncMetaToGA4 = useCallback(async (metaEventName, metaData, metaOptions) => {
    // Se o GA4 não estiver inicializado, tentar inicializar
    if (!ga4.isInitialized) {
      logger.info(LogCategory.INIT, 'GA4 não inicializado, tentando inicializar antes de enviar evento');
      ga4.initialize();
      
      // Se ainda não inicializado, registrar e sair
      if (!ga4.isInitialized) {
        logger.warn(LogCategory.EVENT, `Falha ao inicializar GA4 para evento Meta: ${metaEventName}`);
        return null;
      }
    }
    
    logger.info(LogCategory.EVENT, `Sincronizando evento Meta -> GA4: ${metaEventName}`, metaData);
    
    // Sincronizar dados do usuário, como User ID e User Properties
    syncUserDataToGA4(metaEventName, metaData);
    
    // Enviar o mesmo evento para o GA4, mapeando o nome se necessário
    return ga4.trackEvent(metaEventName, metaData, { 
      mapFromMeta: true,
      ...metaOptions
    });
  }, [ga4, syncUserDataToGA4]);

  // Função que substitui o trackEvent do Meta Pixel
  const enhancedTrackEvent = useCallback(async (eventName, data = {}, options = {}) => {
    // Primeiro, enviar o evento normalmente pelo Meta Pixel
    const metaResult = await metaPixel.trackEvent(eventName, data, options);
    
    // Em seguida, sincronizar com o GA4 (em paralelo, não esperamos)
    syncMetaToGA4(eventName, data, options)
      .catch(error => {
        logger.error(LogCategory.EVENT, `Erro ao sincronizar evento Meta -> GA4: ${eventName}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    
    // Retornar o resultado do Meta Pixel (original)
    return metaResult;
  }, [metaPixel, syncMetaToGA4]);

  // Versão avançada do gateway que intercepta chamadas diretas ao fbq
  const interceptFbq = useCallback(() => {
    if (typeof window === 'undefined' || !window.fbq || isInstalled.current) return false;
    
    // Armazenar a referência original de fbq
    originalFbq.current = window.fbq;
    
    // Substituir o fbq global por nossa versão
    window.fbq = function(...args) {
      // Chamar a função original
      originalFbq.current.apply(this, args);
      
      // Processar os argumentos para sincronizar com GA4
      if (args.length >= 2) {
        const eventType = args[0];
        const eventName = args[1];
        let eventData = {};
        
        // Extrair dados do evento se disponíveis
        if (args.length >= 3 && typeof args[2] === 'object') {
          eventData = args[2];
        }
        
        // Se for um evento de rastreamento, sincronizar com GA4
        if (eventType === 'track') {
          logger.debug(LogCategory.EVENT, `Interceptando chamada direta do fbq: ${eventName}`, eventData);
          
          // Sincronizar com GA4
          syncMetaToGA4(eventName, eventData, {}).catch(error => {
            logger.error(LogCategory.EVENT, `Erro ao sincronizar evento fbq interceptado: ${eventName}`, {
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
      }
    };
    
    // Copiar propriedades do fbq original para manter compatibilidade
    for (const prop in originalFbq.current) {
      if (Object.prototype.hasOwnProperty.call(originalFbq.current, prop)) {
        window.fbq[prop] = originalFbq.current[prop];
      }
    }
    
    logger.info(LogCategory.INIT, 'Instalado interceptador global do fbq');
    return true;
  }, [syncMetaToGA4]);

  // Modificar o objeto do Meta Pixel
  const enhancedMetaPixel = {
    ...metaPixel,
    trackEvent: enhancedTrackEvent
  };
  
  // Função de instalação para substituir globalmente
  const installGateway = useCallback(() => {
    if (typeof window === 'undefined') return { installed: false };
    
    if (isInstalled.current) {
      return { installed: true, method: 'already-installed' };
    }
    
    logger.info(LogCategory.INIT, 'Instalando gateway Meta -> GA4');
    
    // Interceptar chamadas diretas ao fbq
    const fbqIntercepted = interceptFbq();
    
    // Marcar como instalado
    isInstalled.current = true;
    
    return {
      installed: true,
      fbqIntercepted,
      method: fbqIntercepted ? 'global-intercept' : 'hook-override'
    };
  }, [interceptFbq]);

  // Efeito para limpar o interceptador ao desmontar
  useEffect(() => {
    return () => {
      // Restaurar fbq original ao desmontar
      if (typeof window !== 'undefined' && originalFbq.current && isInstalled.current) {
        window.fbq = originalFbq.current;
        logger.debug(LogCategory.INIT, 'Restaurado fbq original na desmontagem');
        isInstalled.current = false;
      }
    };
  }, []);

  return {
    metaPixel: enhancedMetaPixel,
    installGateway,
    ga4,
    isInstalled: isInstalled.current
  };
} 