import { META_PIXEL_CONFIG } from '../config/meta-pixel'
import type { StandardEvent } from '../config/meta-pixel'

/**
 * Verifica se um evento já foi enviado na sessão atual
 */
export function isEventAlreadySent(eventName: string, identifier: string): boolean {
  if (typeof window === 'undefined') return false

  const key = `${META_PIXEL_CONFIG.DEDUPLICATION.KEY_PREFIX}${eventName}_${identifier}`
  const lastSent = sessionStorage.getItem(key)

  if (!lastSent) return false

  const timeSinceLastSent = Date.now() - parseInt(lastSent, 10)
  return timeSinceLastSent < META_PIXEL_CONFIG.DEDUPLICATION.MAX_AGE
}

/**
 * Marca um evento como enviado na sessão atual
 */
export function markEventAsSent(eventName: string, identifier: string): void {
  if (typeof window === 'undefined') return

  const key = `${META_PIXEL_CONFIG.DEDUPLICATION.KEY_PREFIX}${eventName}_${identifier}`
  sessionStorage.setItem(key, Date.now().toString())
}

/**
 * Verifica se um evento é um evento padrão do Meta Pixel
 */
export function isStandardEvent(eventName: string): eventName is StandardEvent {
  return META_PIXEL_CONFIG.STANDARD_EVENTS.includes(eventName as StandardEvent)
}

/**
 * Gera um identificador único para um evento
 */
export function generateEventIdentifier(eventName: string, params: Record<string, any> = {}): string {
  try {
    let identifier = 'default'

    // Customizar identificador com base no tipo de evento
    switch (eventName) {
      case 'ViewContent':
        // Usar content_name ou content_id como identificador
        identifier = params.content_name || params.content_id || params.page_path || 'default'
        break

      case 'Contact':
        // Usar formulário ou página como identificador
        identifier = params.content_name || params.form_id || params.page_path || 'default'
        break

      case 'Lead':
        // Para Lead usamos o email ou telefone (se disponíveis) para deduplicação
        identifier = params.email || params.phone || 'default'
        break

      case 'Scroll':
        // Para scroll usamos threshold + URL
        identifier = `${params.depth_threshold || '0'}_${params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '')}`
        break

      default:
        // Para outros eventos, usar URL da página ou outro parâmetro relevante
        identifier = params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '') || 'default'
    }

    return identifier
  } catch (error) {
    console.error(`${META_PIXEL_CONFIG.LOGGING.PREFIX} Erro ao criar identificador para evento:`, error)
    return 'default'
  }
}

/**
 * Gera um ID único para o evento
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Verifica se todos os parâmetros universais estão presentes
 */
export function validateUniversalParameters(params: Record<string, any>): boolean {
  return META_PIXEL_CONFIG.UNIVERSAL_PARAMETERS.every((param) => {
    const hasParam = param in params
    if (!hasParam && META_PIXEL_CONFIG.LOGGING.VERBOSE) {
      console.warn(`${META_PIXEL_CONFIG.LOGGING.PREFIX} Parâmetro universal ausente: ${param}`)
    }
    return hasParam
  })
}

/**
 * Adiciona parâmetros universais aos dados do evento
 */
export function addUniversalParameters(params: Record<string, any>): Record<string, any> {
  return {
    ...params,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: typeof window !== 'undefined' ? window.location.href : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  }
} 