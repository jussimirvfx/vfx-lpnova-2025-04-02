let isInitialized = false

// Lista de eventos padrão do Facebook Pixel
const STANDARD_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
]

// Função para inicializar o Facebook Pixel
export function initFacebookPixel(): void {
  // Verificar se estamos no lado do cliente
  if (typeof window === "undefined") return

  // Verificar se já foi inicializado globalmente (pelo MetaPixelProvider)
  if (isInitialized || window._fbPixelInitialized) {
    console.log("[Facebook Pixel] Already initialized by another component, skipping...")
    isInitialized = true
    return
  }

  // Marcar como inicializado
  isInitialized = true
  window._fbPixelInitialized = true

  console.log("[Facebook Pixel] Starting initialization...")

  // Inicializar o objeto fbq
  window.fbq = (...args) => {
    // Verificar se há argumentos
    if (args.length === 0) {
      console.warn("[Meta Pixel] - Attempted to call fbq() without arguments")
      return
    }

    window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, args) : window.fbq.queue.push(args)
  }

  if (!window._fbq) window._fbq = window.fbq
  window.fbq.push = window.fbq
  window.fbq.loaded = true
  window.fbq.version = "2.0"
  window.fbq.queue = []

  // Obter o ID do Pixel da variável de ambiente
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  
  if (!pixelId) {
    console.error('[Facebook Pixel] ERRO: NEXT_PUBLIC_FACEBOOK_PIXEL_ID não está definido nas variáveis de ambiente')
    return
  }
  
  // Registrar um evento para garantir que o script seja utilizado
  window.fbq("init", pixelId)

  // Não rastrear PageView automaticamente, isso será feito pelo componente FacebookPixelOptimized
  console.log(`[Facebook Pixel] Initialized ${pixelId} without automatic PageView`)

  // Definir a função global de rastreamento
  if (!window.trackFBEvent) {
    window.trackFBEvent = (event, params) => {
      if (window.fbq) {
        // Verificar se é um evento padrão ou personalizado
        if (STANDARD_EVENTS.includes(event)) {
          window.fbq("track", event, params)
        } else {
          window.fbq("trackCustom", event, params)
        }
        return true
      }
      return false
    }
    console.log("[Facebook Pixel] Global tracking function registered")
  }
}

// Importar funções da API de Conversão
import { getFbc, getFbp, prepareUserData, sendToMetaConversionApi, generateEventId } from "./meta-conversion-api"

// Função para rastrear eventos com suporte a lead scoring e API de Conversão
export function trackPixelEvent(eventName: string, params?: object, leadData?: any): boolean {
  // Verificar se estamos no lado do cliente
  if (typeof window === "undefined") return false

  // Inicializar o pixel se ainda não foi feito
  if (!isInitialized) {
    initFacebookPixel()
  }

  // Gerar um ID de evento único para deduplicação
  const eventId = generateEventId()

  // Obter FBC e FBP para incluir nos parâmetros
  const fbc = getFbc()
  const fbp = getFbp()

  // Adicionar FBC, FBP e eventId aos parâmetros
  const enhancedParams = {
    ...params,
    _fbc: fbc || undefined,
    _fbp: fbp || undefined,
    event_id: eventId, // Adicionar ID do evento para deduplicação
  }

  // Se for um evento de lead e temos dados do lead, aplicar scoring
  if (eventName === "Lead" && leadData) {
    try {
      // Importar dinamicamente para evitar problemas de SSR
      import("./lead-scoring")
        .then(({ calculateLeadScore, scoreToMonetaryValue }) => {
          const { score, isQualified, logDetails } = calculateLeadScore(leadData)

          // Log detalhado para troubleshooting
          console.log("[Lead Scoring] Resultado da avaliação:", {
            ...logDetails,
            leadData: {
              ...leadData,
              // Mascarar dados sensíveis
              email: leadData.email ? `${leadData.email.substring(0, 3)}...` : null,
              phone: leadData.phone ? `${leadData.phone.substring(0, 3)}...` : null,
            },
          })

          // Se o lead for desqualificado, não disparar o evento
          if (!isQualified) {
            console.log("[Facebook Pixel] Lead desqualificado, evento não disparado", logDetails.disqualificationReason)
            return false
          }

          // Converter score para valor monetário
          const monetaryValue = scoreToMonetaryValue(score)

          // Adicionar valor ao evento
          const finalParams = {
            ...enhancedParams,
            value: monetaryValue,
            currency: "BRL",
            lead_score: score,
          }

          console.log("[Facebook Pixel] Disparando evento de lead qualificado:", {
            score,
            monetaryValue,
            eventName,
            eventId, // Log do ID do evento
          })

          // Usar a função global de rastreamento
          if (window.trackFBEvent) {
            window.trackFBEvent(eventName, finalParams)
          } else if (window.fbq) {
            // Extrair o event_id dos parâmetros para usar no formato correto
            const { event_id, ...otherParams } = finalParams

            // Verificar se é um evento padrão ou personalizado
            if (STANDARD_EVENTS.includes(eventName)) {
              window.fbq("track", eventName, otherParams, { eventID: event_id })
            } else {
              window.fbq("trackCustom", eventName, otherParams, { eventID: event_id })
            }
          }

          // Enviar para a API de Conversão do Meta
          const userData = prepareUserData(leadData)
          sendToMetaConversionApi({
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: window.location.href,
            action_source: "website",
            user_data: userData,
            custom_data: finalParams,
            event_id: eventId, // Usar o mesmo ID para deduplicação
          })

          return true
        })
        .catch((error) => {
          console.error("[Lead Scoring] Erro ao calcular score:", error)

          // Em caso de erro, disparar o evento normalmente
          if (window.trackFBEvent) {
            return window.trackFBEvent(eventName, enhancedParams)
          }

          if (window.fbq) {
            // Verificar se é um evento padrão ou personalizado
            if (STANDARD_EVENTS.includes(eventName)) {
              window.fbq("track", eventName, enhancedParams)
            } else {
              window.fbq("trackCustom", eventName, enhancedParams)
            }
            return true
          }
        })

      return true
    } catch (error) {
      console.error("[Lead Scoring] Erro ao processar lead scoring:", error)
    }
  }

  // Para eventos que não são de lead ou sem dados de lead, usar o fluxo normal
  if (window.trackFBEvent) {
    window.trackFBEvent(eventName, enhancedParams)
  } else if (window.fbq) {
    // Extrair o event_id dos parâmetros para usar no formato correto
    const { event_id, ...otherParams } = enhancedParams

    // Verificar se é um evento padrão ou personalizado
    if (STANDARD_EVENTS.includes(eventName)) {
      window.fbq("track", eventName, otherParams, { eventID: event_id })
    } else {
      window.fbq("trackCustom", eventName, otherParams, { eventID: event_id })
    }
  }

  // Para eventos importantes, enviar também para a API de Conversão
  if (
    ["PageView", "Lead", "Contact", "CompleteRegistration", "Purchase"].includes(eventName) ||
    !STANDARD_EVENTS.includes(eventName)
  ) {
    // Preparar dados do usuário (mesmo sem lead data)
    const userData = leadData ? prepareUserData(leadData) : { fbc, fbp }

    console.log(`[Facebook Pixel] Sending ${eventName} to Conversion API:`, {
      event_id: eventId,
      has_fbc: !!userData.fbc,
      has_fbp: !!userData.fbp,
    })

    sendToMetaConversionApi({
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: window.location.href,
      action_source: "website",
      user_data: userData,
      custom_data: enhancedParams,
      event_id: eventId, // Usar o mesmo ID para deduplicação
    }).catch((error) => {
      console.error(`[Facebook Pixel] Error sending ${eventName} to Conversion API:`, error)
    })
  }

  return true
}

