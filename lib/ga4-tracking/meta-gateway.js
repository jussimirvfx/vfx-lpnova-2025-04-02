"use client";

import { logger, LogCategory } from './core/logger';
import { useCallback, useEffect } from 'react';
import { useGA4 } from './hooks/useGA4';
import { useMetaPixel } from '../meta-tracking/hooks/useMetaPixel';

/**
 * Mapeamento de propriedades do usuário do Meta para o GA4
 * Deixe um objeto vazio para não mapear nenhuma propriedade automaticamente
 */
const USER_PROPERTIES_MAP = {
  // Exemplo: mapear propriedades do Meta para o GA4
  // 'metaPropertyName': 'ga4PropertyName',
};

/**
 * Hook para conectar eventos do Meta Pixel com o GA4
 * Este hook sobrescreve o método trackEvent do Meta Pixel para enviar 
 * os mesmos eventos também para o GA4
 */
export function useMetaGA4Gateway() {
  const ga4 = useGA4();
  const metaPixel = useMetaPixel();
  
  // Função para extrair e transmitir User ID e User Properties
  // com base nos dados do Meta Pixel ou do contexto da aplicação
  const syncUserDataToGA4 = useCallback((metaEventName, metaData = {}) => {
    // IMPORTANTE: Esta função deve ser personalizada de acordo com sua lógica
    // de negócios e como você armazena o User ID e User Properties.
    
    // Exemplo: extrair user_id dos dados do evento ou de um estado global da aplicação
    if (metaData.user_id && typeof metaData.user_id === 'string') {
      ga4.setUserId(metaData.user_id);
      logger.debug(LogCategory.USER, 'User ID extraído do Meta e configurado no GA4', { userId: metaData.user_id });
    } else if (window._appUserContext && window._appUserContext.userId) {
      // Exemplo: obter do contexto global (personalizar conforme necessário)
      ga4.setUserId(window._appUserContext.userId);
      logger.debug(LogCategory.USER, 'User ID obtido do contexto da aplicação e configurado no GA4');
    }
    
    // Exemplo: mapear propriedades do usuário presentes no metaData para GA4
    const userProps = {};
    
    // Extração direta de propriedades configuradas no mapeamento
    Object.entries(USER_PROPERTIES_MAP).forEach(([metaProp, ga4Prop]) => {
      if (metaData[metaProp] !== undefined) {
        userProps[ga4Prop] = metaData[metaProp];
      }
    });
    
    // Exemplo: obter dados da aplicação, como preferências do usuário
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
    // Se o GA4 não estiver inicializado, apenas registra e não faz nada
    if (!ga4.isInitialized) {
      logger.debug(LogCategory.EVENT, `GA4 não inicializado para receber evento Meta: ${metaEventName}`);
      return null;
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

  // Modificar o objeto do Meta Pixel
  const enhancedMetaPixel = {
    ...metaPixel,
    trackEvent: enhancedTrackEvent
  };
  
  // Função avançada para interceptar diretamente chamadas do fbq
  const monkeyPatchFbq = useCallback(() => {
    if (typeof window === 'undefined' || !window.fbq) return false;
    
    logger.info(LogCategory.INIT, 'Criando monkey-patch para window.fbq');
    
    // Armazenar referência original do fbq
    const originalFbq = window.fbq;
    
    // Substituir fbq por nossa função que primeiro chama o original
    // e depois sincroniza o evento com o GA4
    window.fbq = function patchedFbq(call, eventName, ...args) {
      // Chamar fbq original para garantir que o comportamento do Meta Pixel não seja afetado
      const result = originalFbq.call(this, call, eventName, ...args);
      
      // Se for um evento de rastreamento, sincronizamos com o GA4
      if (call === 'track' && eventName) {
        // Extrair dados do evento (o primeiro argumento depois do eventName, se existir)
        const eventData = args.length > 0 ? args[0] || {} : {};
        
        // Sincronizar evento com GA4
        syncMetaToGA4(eventName, eventData, {})
          .catch(error => {
            logger.error(LogCategory.EVENT, `Erro ao sincronizar evento direto do fbq para GA4: ${eventName}`, {
              error: error instanceof Error ? error.message : String(error)
            });
          });
      }
      
      // Retornar o resultado original
      return result;
    };
    
    // Copiar propriedades e métodos do fbq original
    Object.assign(window.fbq, originalFbq);
    
    // Garantir que a função queue seja mantida
    window.fbq.queue = originalFbq.queue;
    
    return true;
  }, [syncMetaToGA4]);
  
  // Função de instalação aprimorada
  const installGateway = useCallback(() => {
    if (typeof window === 'undefined') return { installed: false };
    
    logger.info(LogCategory.INIT, 'Instalando gateway Meta -> GA4');
    
    // Implementar monkey patch para fbq
    const monkeyPatchSuccess = monkeyPatchFbq();
    
    // Verificar se o gateway foi instalado com sucesso
    const installed = monkeyPatchSuccess || metaPixel.isInitialized;
    
    if (installed) {
      logger.info(LogCategory.INIT, 'Gateway Meta -> GA4 instalado com sucesso', {
        viaMonkeyPatch: monkeyPatchSuccess,
        viaHook: metaPixel.isInitialized
      });
    } else {
      logger.warn(LogCategory.INIT, 'Falha ao instalar Gateway Meta -> GA4 - Meta Pixel não encontrado');
    }
    
    return {
      installed,
      viaMonkeyPatch: monkeyPatchSuccess
    };
  }, [monkeyPatchFbq, metaPixel.isInitialized]);

  // Hook para instalar o gateway automaticamente quando os componentes estiverem prontos
  useEffect(() => {
    // Apenas instalar se tanto o Meta Pixel quanto o GA4 estiverem inicializados
    if (metaPixel.isInitialized && ga4.isInitialized) {
      installGateway();
    }
  }, [metaPixel.isInitialized, ga4.isInitialized, installGateway]);

  return {
    metaPixel: enhancedMetaPixel,
    installGateway,
    ga4
  };
} 