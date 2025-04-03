"use client"

import { useEffect, useCallback, useState } from "react"
import { META_PIXEL_CONFIG } from "@/lib/config/meta-pixel"
import type { MetaPixelEvent, MetaPixelOptions, MetaPixelHook, MetaPixelInstance } from "@/lib/types/meta-pixel.d"
import logger, { LogCategory, LogLevel } from "@/lib/utils/logger"
import { generateEventId, normalizeAndHashPhone, normalizeAndHashEmail, hashData, getFbp, getFbc } from "@/lib/meta-conversion-api"

// Chave para o localStorage de eventos enviados
const STORAGE_KEY = '_meta_events_sent';

const EXTERNAL_ID_COOKIE_NAME = '_vfx_extid';

/**
 * Obter eventos já enviados do localStorage
 */
function getSentEvents(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return {};
    
    return JSON.parse(storedData);
  } catch (error) {
    logger.error(
      LogCategory.META_PIXEL, 
      'Erro ao obter eventos enviados do localStorage',
      { error: error instanceof Error ? error.message : String(error) }
    );
    return {};
  }
}

/**
 * Salvar eventos enviados no localStorage
 */
function saveSentEvents(events: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    logger.error(
      LogCategory.META_PIXEL, 
      'Erro ao salvar eventos no localStorage',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Função para verificar se um evento já foi enviado
function isEventAlreadySent(eventName: string, identifier: string): boolean {
  // Ignorar verificação para PageViews - eles podem ocorrer múltiplas vezes
  if (eventName === 'PageView') {
    return false;
  }
  
  // Tratamento normal para outros eventos
  const events = getSentEvents();
  const key = `${eventName}:${identifier}`;
  const timestamp = events[key];
  
  if (!timestamp) {
    logger.debug(
      LogCategory.META_PIXEL, 
      `Verificando evento: ${eventName}`, 
      { identifier, result: 'não encontrado' }
    );
    return false;
  }

  const maxAge = META_PIXEL_CONFIG.DEDUPLICATION.MAX_AGE_HOURS * 60 * 60 * 1000;
  const isDuplicate = Date.now() - timestamp < maxAge;
  
  logger.debug(
    LogCategory.META_PIXEL, 
    `Verificando evento: ${eventName}`, 
    { 
      identifier, 
      result: isDuplicate ? 'duplicado' : 'expirado',
      timestamp,
      age: Date.now() - timestamp,
      maxAge
    }
  );
  
  return isDuplicate;
}

// Função para marcar um evento como enviado
function markEventAsSent(eventName: string, identifier: string): void {
  // Não guardamos PageViews no sistema de deduplicação - eles podem ocorrer múltiplas vezes
  if (eventName === 'PageView') {
    return;
  }
  
  const events = getSentEvents();
  const key = `${eventName}:${identifier}`;
  
  events[key] = Date.now();
  
  // Limpar eventos expirados
  const maxAge = META_PIXEL_CONFIG.DEDUPLICATION.MAX_AGE_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  
  Object.keys(events).forEach(k => {
    if (now - events[k] > maxAge) {
      delete events[k];
    }
  });
  
  saveSentEvents(events);
  
  logger.debug(
    LogCategory.META_PIXEL, 
    `Evento marcado como enviado: ${eventName}`,
    { identifier, timestamp: Date.now() }
  );
}

// Função para adicionar parâmetros universais ao evento
function addUniversalParameters(params: Record<string, any>): Record<string, any> {
  if (typeof window === 'undefined') return params;

  // Extrair FBP e FBC dos cookies
  const fbp = document.cookie.match(/_fbp=([^;]+)/)?.pop() || null;
  const fbc = document.cookie.match(/_fbc=([^;]+)/)?.pop() || null;

  return {
    ...params,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    page_title: typeof document !== 'undefined' ? document.title : '',
    page_path: window.location.pathname,
    browser_language: navigator.language || '',
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    referrer: document.referrer || undefined
  };
}

// Função para validar parâmetros universais
function validateUniversalParameters(params: Record<string, any>): boolean {
  return META_PIXEL_CONFIG.UNIVERSAL_PARAMETERS.every((param) => param in params);
}

// Função para obter external_id dos cookies
function getExternalId(): string | null {
  if (typeof document === 'undefined') return null;

  console.log('[EXTERNAL_ID] Buscando nos cookies do cliente');
  console.log('[EXTERNAL_ID] Todos os cookies:', document.cookie);
  
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(EXTERNAL_ID_COOKIE_NAME + '=')) {
      const value = cookie.substring(EXTERNAL_ID_COOKIE_NAME.length + 1);
      console.log(`[EXTERNAL_ID] ENCONTRADO NO CLIENTE: ${value}`);
      return value;
    }
  }
  
  console.log('[EXTERNAL_ID] NÃO ENCONTRADO NO CLIENTE');
  return null;
}

// Função para enviar evento via API de Conversões
async function sendConversionAPI(event: MetaPixelEvent, retryCount = 0): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Configuração especial para evento PageView
  const isPageViewEvent = event.event_name === 'PageView';
  
  // Definir número máximo de tentativas
  const MAX_RETRIES = 2;
  
  // Log início da requisição
  logger.info(
    LogCategory.CONVERSION_API, 
    `Iniciando envio para API: ${event.event_name}`,
    { 
      eventId: event.event_id,
      retry: retryCount
    }
  );

  try {
    const startTime = performance.now();
    
    // Para PageView, esperar um pouco para garantir que os cookies sejam criados
    if (isPageViewEvent && retryCount === 0) {
      logger.debug(
        LogCategory.CONVERSION_API,
        'Aguardando 1 segundo para garantir que cookies sejam criados',
        { eventName: event.event_name }
      );
      
      // Esperar 1 segundo para cookies serem criados
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Extrair FBP e FBC para user_data
    const fbp = document.cookie.match(/_fbp=([^;]+)/)?.pop() || null;
    const fbc = document.cookie.match(/_fbc=([^;]+)/)?.pop() || null;
    
    // Obter todos os cookies para logs
    const allCookies = document.cookie;
    
    // Obter URL completa para diagnóstico
    const fullUrl = window.location.href;
    const urlPath = window.location.pathname;
    const urlSearch = window.location.search;
    const referrer = document.referrer;
    
    logger.info(
      LogCategory.CONVERSION_API,
      'Cookies e URL para rastreamento',
      { 
        fbp,
        fbc,
        cookiesLength: allCookies.length,
        url: fullUrl,
        path: urlPath,
        search: urlSearch,
        referrer
      }
    );
    
    // Parâmetros para enriquecimento dos dados do usuário
    const browserLanguage = navigator.language || '';
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    
    // 1. Construir o objeto user_data principal
    const apiUserData: any = {
      client_user_agent: navigator.userAgent,
      fbp: fbp,
      fbc: fbc,
    };

    // Adicionar external_id se disponível
    const externalId = getExternalId();
    if (externalId) {
      apiUserData.external_id = hashData(externalId);
      console.log(
        '[EXTERNAL_ID] Adicionado ao evento da API:',
        externalId,
        '->',
        apiUserData.external_id.substring(0, 10) + '...'
      );
    } else {
      console.log('[EXTERNAL_ID] Não disponível para evento da API');
    }

    // Adicionar dados do usuário do evento (ph, em, fn, etc.) se existirem
    if (event.user_data) {
      for (const key in event.user_data) {
        if (event.user_data.hasOwnProperty(key) && event.user_data[key] !== null && event.user_data[key] !== undefined) {
          // Garantir que os campos sejam strings únicas e não arrays
          if (['em', 'ph', 'fn', 'ln', 'ge', 'db', 'zp', 'ct', 'st', 'country', 'external_id'].includes(key)) {
            // Se for array, usar o primeiro valor; caso contrário, usar o valor diretamente
            apiUserData[key] = Array.isArray(event.user_data[key]) 
              ? event.user_data[key][0] 
              : event.user_data[key];
          } else {
            apiUserData[key] = event.user_data[key]; // Para outros campos caso existam
          }
        }
      }
    }
    
    // 2. Construir o objeto custom_data
    const apiCustomData: any = { 
      ...event.custom_data, // Incluir custom_data do evento original
      // Enriquecer com dados adicionais
      browser_language: browserLanguage,
      screen_width: screenWidth,
      screen_height: screenHeight,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      timezone: timezone,
      referrer: referrer || undefined,
      url_search: urlSearch || undefined,
      page_title: document.title || undefined // Incluir título da página aqui também
    };

    // Remover o objeto user_data aninhado de custom_data, se existir
    if (apiCustomData.user_data) {
      delete apiCustomData.user_data;
    }

    // 3. Montar o eventData final para enviar para nosso servidor
    const eventData = {
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      event_source_url: event.event_source_url || window.location.href,
      action_source: "website",
      user_data: apiUserData,
      custom_data: apiCustomData
    };
    
    // Log dos dados do evento
    logger.debug(
      LogCategory.CONVERSION_API, 
      `Payload do evento para API própria (${event.event_name})`,
      { 
        eventId: event.event_id,
        eventTime: event.event_time,
        userDataKeys: Object.keys(apiUserData)
      }
    );
    
    // Fazer requisição para o nosso endpoint em vez da API do Meta diretamente
    // Assim o servidor vai adicionar automaticamente o IP real do cliente
    console.log(`[IP-TRACKING] Enviando evento ${event.event_name} para endpoint próprio para captura de IP`);
    const response = await fetch('/api/meta-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const responseTime = performance.now() - startTime;
    
    // Verificar resposta
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(
        LogCategory.CONVERSION_API, 
        `Erro na resposta HTTP da API própria: ${event.event_name}`,
        { 
          eventId: event.event_id,
          status: response.status,
          body: responseText,
          responseTime
        }
      );
      
      // Retry para erros 5xx (servidor) ou 429 (rate limiting)
      if (
        (response.status >= 500 || response.status === 429) && 
        retryCount < MAX_RETRIES
      ) {
        // Esperar um tempo exponencial antes de tentar novamente
        const waitTime = Math.pow(2, retryCount) * 1000;
        logger.warn(
          LogCategory.CONVERSION_API,
          `Tentando novamente em ${waitTime}ms...`,
          { retryCount: retryCount + 1, maxRetries: MAX_RETRIES }
        );
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return sendConversionAPI(event, retryCount + 1);
      }
      
      return false;
    }

    const data = await response.json();
    
    if (!data.success) {
      logger.error(
        LogCategory.CONVERSION_API, 
        `Erro na resposta da API própria: ${event.event_name}`,
        { 
          eventId: event.event_id,
          error: data.error,
          responseTime
        }
      );
      
      // Retry para erros que podem ser resolvidos com nova tentativa
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        logger.warn(
          LogCategory.CONVERSION_API,
          `Tentando novamente em ${waitTime}ms...`,
          { retryCount: retryCount + 1, maxRetries: MAX_RETRIES }
        );
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return sendConversionAPI(event, retryCount + 1);
      }
      
      return false;
    }

    // Log sucesso
    logger.info(
      LogCategory.CONVERSION_API, 
      `Evento enviado com sucesso via API: ${event.event_name}`,
      { 
        eventId: event.event_id,
        responseTime: `${Math.round(responseTime)}ms`,
        success: data.success
      }
    );
    return true;
  } catch (error) {
    // Log erro
    logger.error(
      LogCategory.CONVERSION_API, 
      `Erro ao enviar evento via API: ${event.event_name}`,
      { 
        eventId: event.event_id,
        error: error instanceof Error ? error.message : String(error),
        retryCount
      }
    );
    
    // Retry para erros de rede
    if (retryCount < MAX_RETRIES) {
      const waitTime = Math.pow(2, retryCount) * 1000;
      logger.warn(
        LogCategory.CONVERSION_API,
        `Tentando novamente em ${waitTime}ms após erro de rede...`,
        { retryCount: retryCount + 1, maxRetries: MAX_RETRIES }
      );
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return sendConversionAPI(event, retryCount + 1);
    }
    
    return false;
  }
}

// Função para enviar evento via Pixel do navegador (fbq)
function sendPixelEvent(event: MetaPixelEvent): boolean {
  if (typeof window === 'undefined' || !isPixelInitialized()) {
    logger.warn(
      LogCategory.META_PIXEL, 
      'Pixel não inicializado, impossível enviar evento',
      { eventName: event.event_name }
    );
    return false;
  }

  try {
    // Obter ID do evento ou gerar um novo
    const eventId = event.event_id || generateEventId();
    
    // Obter parâmetros base
    const baseParams = {
      event_id: eventId,
    };
    
    // Obter dados de usuário
    let userData = event.user_data || {};
    
    // Adicionar external_id aos dados do usuário se disponível
    const externalId = getExternalId();
    if (externalId) {
      userData.external_id = hashData(externalId);
      console.log(
        `[EXTERNAL_ID] Adicionado ao evento ${event.event_name} do Pixel:`,
        externalId,
        '->',
        userData.external_id.substring(0, 10) + '...'
      );
    } else {
      console.log(`[EXTERNAL_ID] Não disponível para evento ${event.event_name} do Pixel`);
    }
    
    // Converter parâmetros para formato esperado pelo fbq
    const pixelParams = {
      ...baseParams,
      ...event.custom_data
    };
    
    // Preparar opções com os dados do usuário
    const pixelOptions = {
      eventID: eventId,
      user_data: userData
    };
    
    // Verificar se o evento é padrão
    const isStandardEvent = META_PIXEL_CONFIG.STANDARD_EVENTS.includes(event.event_name as any);
    
    // Usar o formato correto para o evento
    if (isStandardEvent) {
      // Eventos padrão usam esta sintaxe
      logger.debug(
        LogCategory.META_PIXEL, 
        `Chamando fbq('track', '${event.event_name}')`,
        { isStandardEvent: true }
      );
      // @ts-ignore - O TypeScript não reconhece o quarto parâmetro, mas a documentação do FB indica que é necessário
      window.fbq("track", event.event_name, pixelParams, pixelOptions);
    } else {
      // Eventos personalizados usam esta sintaxe
      logger.debug(
        LogCategory.META_PIXEL, 
        `Chamando fbq('trackCustom', '${event.event_name}')`,
        { isStandardEvent: false }
      );
      // @ts-ignore - O TypeScript não reconhece o quarto parâmetro, mas a documentação do FB indica que é necessário
      window.fbq("trackCustom", event.event_name, pixelParams, pixelOptions);
    }

    // Log sucesso
    logger.info(
      LogCategory.META_PIXEL, 
      `Evento enviado com sucesso via Pixel: ${event.event_name}`,
      { 
        eventId,
        method: isStandardEvent ? 'track' : 'trackCustom'
      }
    );
    return true;
  } catch (error) {
    // Log erro
    logger.error(
      LogCategory.META_PIXEL, 
      `Erro ao enviar evento via Pixel: ${event.event_name}`,
      { 
        eventId: event.event_id || 'desconhecido',
        error: error instanceof Error ? error.message : String(error)
      }
    );
    return false;
  }
}

// Verificar se o pixel está inicializado
function isPixelInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar se o objeto fbq existe e se parece estar inicializado
  // @ts-ignore - Ignorando erros de tipo aqui porque sabemos que a propriedade loaded pode existir
  return !!(window.fbq && (window.fbq.loaded === true || window._fbPixelInitialized === true));
}

/**
 * Adiciona script inline para substituir o método fbq antes que o script do Facebook seja carregado
 */
function adicionarScriptProtecao(): void {
  if (typeof window === 'undefined') return;
  if (window._fbPixelProtected) return;
  
  try {
    // Criar script que executa antes de qualquer coisa
    const script = document.createElement('script');
    script.innerHTML = `
      // Proteção contra PageView automático
      (function() {
        // Criar uma fila para armazenar chamadas futuras
        window._fbq_calls = [];
        
        // Criar um proxy para fbq que redireciona chamadas
        window.fbq = function() {
          var args = Array.prototype.slice.call(arguments);
          
          // Se for um PageView automático (sem eventID no options), bloquear
          if (
            args[0] === 'track' && 
            args[1] === 'PageView' && 
            (!args[3] || !args[3].eventID)
          ) {
            console.warn('[Meta Pixel] Bloqueado PageView automático');
            return;
          }
          
          // Armazenar chamada para executar depois
          window._fbq_calls.push(args);
        };
        
        // Marcar como protegido
        window._fbPixelProtected = true;
      })();
    `;
    
    // Inserir no início do <head>
    const head = document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    
    logger.debug(LogCategory.INIT, 'Script de proteção do PageView instalado no DOM');
  } catch (error) {
    logger.error(
      LogCategory.INIT, 
      'Erro ao instalar script de proteção',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Hook principal do Meta Pixel
export function useMetaPixel(): MetaPixelHook {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Instalar proteção contra PageView automático antes de tudo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Adicionar script protetor
    adicionarScriptProtecao();
  }, []);

  // Verificar se o pixel já está inicializado no cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Se o fbq existe e está carregado, considere inicializado
    // @ts-ignore - Ignorando erros de tipo aqui porque sabemos que a propriedade loaded pode existir
    if (isPixelInitialized()) {
      logger.info(
        LogCategory.INIT, 
        'Meta Pixel detectado como já inicializado',
        // @ts-ignore
        { fbqLoaded: window.fbq?.loaded || window._fbPixelInitialized }
      );
      
      setIsInitialized(true);
    }
  }, []);

  // Função para inicializar o Meta Pixel
  const initializePixel = useCallback((pixelId: string) => {
    if (typeof window === "undefined") return;
    
    // Verificar se já inicializado
    if (window._fbPixelInitialized) {
      logger.info(
        LogCategory.INIT, 
        'Meta Pixel já inicializado, ignorando',
        { pixelId }
      );
      setIsInitialized(true);
      return;
    }

    logger.info(
      LogCategory.INIT, 
      'Iniciando inicialização do Meta Pixel',
      { pixelId, timestamp: Date.now() }
    );

    // Inicializar o pixel
    const fbq = function(this: any, ...args: any[]) {
      logger.debug(
        LogCategory.META_PIXEL, 
        'Chamada fbq', 
        { args }
      );
      
      // Interceptar chamadas de PageView automático
      if (args[0] === 'track' && args[1] === 'PageView' && (!args[3] || !args[3].eventID)) {
        logger.warn(
          LogCategory.META_PIXEL, 
          'Bloqueando PageView automático na inicialização',
          { args }
        );
        return;
      }
      
      // @ts-ignore
      fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
    } as MetaPixelInstance;

    // @ts-ignore - Adicionando propriedades extras que sabemos que existem no objeto fbq real
    fbq.push = fbq;
    // @ts-ignore
    fbq.loaded = true;
    // @ts-ignore
    fbq.version = "2.0";
    // @ts-ignore
    fbq.queue = [];
    
    // Substituir o objeto global
    window.fbq = fbq;
    
    // Processar chamadas que foram interceptadas pelo script protetor
    // @ts-ignore
    if (window._fbq_calls && Array.isArray(window._fbq_calls)) {
      // @ts-ignore
      window._fbq_calls.forEach(args => {
        if (args[0] === 'track' && args[1] === 'PageView' && (!args[3] || !args[3].eventID)) {
          logger.warn(
            LogCategory.META_PIXEL, 
            'Bloqueando PageView automático na fila',
            { args }
          );
        } else {
          // @ts-ignore
          fbq.apply(null, args);
        }
      });
      // @ts-ignore
      window._fbq_calls = [];
    }

    // Carregar o script do Meta Pixel
    logger.debug(LogCategory.INIT, 'Carregando script do Facebook');
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.async = true;
    
    // Adicionar callback onload
    script.onload = () => {
      logger.info(
        LogCategory.INIT, 
        'Script do Facebook carregado com sucesso'
      );
      setIsInitialized(true);
    };
    
    script.onerror = (error) => {
      logger.error(
        LogCategory.INIT, 
        'Erro ao carregar script do Facebook',
        { error: String(error) }
      );
    };
    
    document.head.appendChild(script);

    // Inicializar o pixel com o ID fornecido
    logger.info(
      LogCategory.INIT, 
      `Chamando fbq('init', '${pixelId}')`,
      { disableAutoPageView: true }
    );
    
    // Inicializar com opções para desativar PageView automático
    window.fbq("init", pixelId, { no_script: 1 });
    window._fbPixelInitialized = true;

    logger.info(
      LogCategory.INIT, 
      'Meta Pixel inicializado com sucesso',
      { 
        pixelId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    );

    // Função cleanup
    return () => {
      logger.debug(LogCategory.INIT, 'Limpando Meta Pixel');
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Função para rastrear eventos
  const trackEvent = useCallback(
    async (eventName: string, params: Record<string, any> = {}, options?: MetaPixelOptions) => {
      // Verificar se o pixel está carregado mesmo que isInitialized não esteja definido
      if (typeof window === 'undefined' || !window.fbq) {
        logger.warn(
          LogCategory.META_PIXEL, 
          `Meta Pixel não inicializado ao tentar rastrear: ${eventName}`,
          { params }
        );
        return;
      }

      logger.info(
        LogCategory.META_PIXEL, 
        `Iniciando rastreamento de evento: ${eventName}`,
        { paramsCount: Object.keys(params).length }
      );

      try {
        // Gerar ID de evento
        const eventId = options?.eventID || generateEventId();

        // 1. Obter dados customizados (params da chamada) e adicionar parâmetros universais do navegador
        const customData = addUniversalParameters(params);

        // Validar parâmetros universais (contidos em customData agora)
        if (!validateUniversalParameters(customData)) {
          logger.error(
            LogCategory.META_PIXEL, 
            `Parâmetros universais inválidos: ${eventName}`,
            { params: customData }
          );
          throw new Error("Parâmetros universais inválidos");
        }

        // 2. Obter dados do usuário (passados explicitamente via options)
        const userDataFromOptions = options?.user_data || {};

        // 3. Criar evento separando custom_data e user_data corretamente
        const event: MetaPixelEvent = {
          event_name: eventName,
          event_id: eventId,
          custom_data: customData, // Dados específicos do evento + universais do navegador
          user_data: userDataFromOptions, // Dados específicos do usuário (ph, em, etc.)
          event_source_url: window.location.href,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
        };

        logger.info(
          LogCategory.META_PIXEL, 
          `Evento preparado: ${eventName}`,
          { 
            eventId,
            hasParams: Object.keys(customData).length > 0,
            // Logar baseado no user_data corretamente obtido das opções
            hasUserData: Object.keys(userDataFromOptions).length > 0,
            userDataKeys: Object.keys(userDataFromOptions)
          }
        );

        // Tentar enviar via API de Conversões, mas não bloquear se falhar
        try {
          await sendConversionAPI(event);
        } catch (apiError) {
          logger.warn(
            LogCategory.META_PIXEL,
            `Falha na API de Conversões, continuando com o Pixel: ${eventName}`,
            { error: apiError instanceof Error ? apiError.message : String(apiError) }
          );
          // Continuamos mesmo se a API falhar
        }
        
        // Enviar via browser - independente do resultado da API
        const pixelSuccess = sendPixelEvent(event);
        
        if (pixelSuccess) {
          logger.info(
            LogCategory.META_PIXEL, 
            `Evento processado com sucesso: ${eventName}`,
            { eventId }
          );
        }
      } catch (error) {
        logger.error(
          LogCategory.META_PIXEL, 
          `Erro ao processar evento: ${eventName}`,
          { 
            error: error instanceof Error ? error.message : String(error),
            params
          }
        );
      }
    },
    [isInitialized]
  );

  // Função para rastrear visualização de página
  const trackPageView = useCallback(async () => {
    // Verificar se o pixel está carregado mesmo que isInitialized não esteja definido
    if (typeof window === 'undefined' || !window.fbq) {
      logger.warn(
        LogCategory.PAGE_VIEW, 
        'Meta Pixel não inicializado ao tentar rastrear PageView'
      );
      return;
    }

    logger.info(
      LogCategory.PAGE_VIEW, 
      'Iniciando rastreamento de PageView',
      { 
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      }
    );

    try {
      // Gerar ID de evento
      const eventId = generateEventId();
      const pageUrl = window.location.href;
      const pagePath = window.location.pathname;

      // Adicionar parâmetros universais
      const eventParams = addUniversalParameters({});

      logger.debug(
        LogCategory.PAGE_VIEW, 
        'Parâmetros universais do PageView',
        eventParams
      );

      // Validar parâmetros universais
      if (!validateUniversalParameters(eventParams)) {
        logger.error(
          LogCategory.PAGE_VIEW, 
          'Parâmetros universais inválidos para PageView',
          { params: eventParams }
        );
        throw new Error("Parâmetros universais inválidos");
      }

      // Obter FBP e FBC para user_data
      const fbp = getFbp();
      const fbc = getFbc();

      // Preparar dados do usuário para o evento
      const userData = {
        fbp: fbp,
        fbc: fbc,
        client_user_agent: navigator.userAgent,
        client_ip_address: null // Será preenchido pelo servidor
      };

      // Criar evento
      const event: MetaPixelEvent = {
        event_name: "PageView",
        event_id: eventId,
        custom_data: eventParams,
        user_data: userData, // Adicionar dados do usuário ao evento
        event_source_url: pageUrl,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
      };

      logger.info(
        LogCategory.PAGE_VIEW, 
        'Evento PageView preparado',
        { 
          eventId,
          url: window.location.href,
          path: pagePath
        }
      );

      // Tentar enviar via API de Conversões, mas não bloquear se falhar
      try {
        await sendConversionAPI(event);
      } catch (apiError) {
        logger.warn(
          LogCategory.PAGE_VIEW,
          'Falha na API de Conversões, continuando com o Pixel do navegador',
          { error: apiError instanceof Error ? apiError.message : String(apiError) }
        );
        // Continuamos mesmo se a API falhar
      }
      
      // Enviar via browser - independente do resultado da API
      const pixelSuccess = sendPixelEvent(event);
      
      if (pixelSuccess) {
        logger.info(
          LogCategory.PAGE_VIEW, 
          'PageView processado com sucesso',
          { 
            eventId,
            timestamp: Date.now(),
            path: pagePath
          }
        );
      }
    } catch (error) {
      logger.error(
        LogCategory.PAGE_VIEW, 
        'Erro ao processar PageView',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }, [isInitialized]);

  // Função para rastrear eventos customizados
  const trackCustomEvent = useCallback(
    async (eventName: string, params: Record<string, any> = {}) => {
      // Verificar se o pixel está carregado mesmo que isInitialized não esteja definido
      if (typeof window === 'undefined' || !window.fbq) {
        logger.warn(
          LogCategory.META_PIXEL, 
          `Meta Pixel não inicializado ao tentar rastrear evento customizado: ${eventName}`
        );
        return;
      }

      logger.info(
        LogCategory.META_PIXEL,
        `Iniciando rastreamento de evento customizado: ${eventName}`
      );

      return trackEvent(eventName, params);
    },
    [isInitialized, trackEvent]
  );

  return {
    isInitialized,
    initializePixel,
    trackEvent,
    trackPageView,
    trackCustomEvent,
  };
} 