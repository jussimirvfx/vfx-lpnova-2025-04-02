"use client"

import { useMetaPixelContext } from "@/lib/contexts/meta-pixel-context"
import { useCallback } from "react"

// Interface para os parâmetros de visualização de vídeo
interface VideoViewParams {
  video_title?: string
  video_url?: string
  video_duration?: number // em segundos
  video_percent?: number // 0-100
  video_status: "started" | "progress" | "25_percent" | "50_percent" | "75_percent" | "completed"
}

// Interface para os parâmetros de scroll
interface ScrollParams {
  scroll_depth: number // 0-100
  scroll_position: number // pixels
  page_height: number // pixels
  content_name?: string
  page_url?: string
}

/**
 * Hook personalizado para rastreamento de eventos
 * Fornece funções para rastrear diferentes tipos de eventos
 */
export function useEventTracking() {
  const { trackEvent } = useMetaPixelContext()

  /**
   * Rastreia eventos de visualização de vídeo
   */
  const trackVideoView = useCallback((params: VideoViewParams): void => {
    if (typeof window === 'undefined') return

    // Preparar dados para o evento
    const eventData = {
      content_type: "video",
      content_name: params.video_title || "Video Content",
      content_url: params.video_url || window.location.href,
      video_duration: params.video_duration,
      video_percent: params.video_percent,
      video_status: params.video_status,
      value: params.video_status === "completed" ? 1 : 0.1, // Valor maior para conclusões
      currency: "BRL",
    }

    // Enviar para o Meta Pixel
    trackEvent("VideoView", eventData)

    console.log("[Event Tracking] VideoView tracked:", {
      status: params.video_status,
      percent: params.video_percent,
      title: params.video_title,
    })
  }, [trackEvent])

  /**
   * Rastreia eventos de scroll na página
   */
  const trackScroll = useCallback((params: ScrollParams): void => {
    if (typeof window === 'undefined') return

    // Preparar dados para o evento
    const eventData = {
      content_type: "scroll",
      content_name: params.content_name || (typeof document !== 'undefined' ? document.title : ''),
      content_url: params.page_url || window.location.href,
      scroll_depth: params.scroll_depth,
      scroll_position: params.scroll_position,
      page_height: params.page_height,
      value: params.scroll_depth >= 90 ? 0.5 : 0.1, // Valor maior para scroll profundo
      currency: "BRL",
    }

    // Enviar para o Meta Pixel
    trackEvent("Scroll", eventData)

    console.log("[Event Tracking] Scroll tracked:", {
      depth: params.scroll_depth + "%",
      position: params.scroll_position + "px",
      pageHeight: params.page_height + "px",
    })
  }, [trackEvent])

  /**
   * Inicializa o rastreamento de scroll
   */
  const initScrollTracking = useCallback((): void => {
    if (typeof window === "undefined") return

    // Objeto para controlar os marcos de scroll já atingidos
    const scrollMilestones: { [key: string]: boolean } = {
      "25": false,
      "50": false,
      "75": false,
      "90": false,
    }

    // Função para calcular a profundidade do scroll
    const calculateScrollDepth = () => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      )
      const windowHeight = window.innerHeight

      // Se a altura do documento for menor ou igual à altura da janela,
      // consideramos como 100% de scroll
      if (documentHeight <= windowHeight) {
        return
      }

      const scrollPercent = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      )

      // Verificar cada marco de scroll
      if (scrollPercent >= 25 && !scrollMilestones["25"]) {
        scrollMilestones["25"] = true
        trackScroll({
          scroll_depth: 25,
          scroll_position: scrollTop,
          page_height: documentHeight,
          page_url: window.location.href,
        })
      }

      if (scrollPercent >= 50 && !scrollMilestones["50"]) {
        scrollMilestones["50"] = true
        trackScroll({
          scroll_depth: 50,
          scroll_position: scrollTop,
          page_height: documentHeight,
          page_url: window.location.href,
        })
      }

      if (scrollPercent >= 75 && !scrollMilestones["75"]) {
        scrollMilestones["75"] = true
        trackScroll({
          scroll_depth: 75,
          scroll_position: scrollTop,
          page_height: documentHeight,
          page_url: window.location.href,
        })
      }

      if (scrollPercent >= 90 && !scrollMilestones["90"]) {
        scrollMilestones["90"] = true
        trackScroll({
          scroll_depth: 90,
          scroll_position: scrollTop,
          page_height: documentHeight,
          page_url: window.location.href,
        })
      }
    }

    // Adicionar listener de scroll com throttling para melhor performance
    let scrollTimeout: NodeJS.Timeout | null = null
    window.addEventListener("scroll", () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(calculateScrollDepth, 200)
    })

    console.log("[Event Tracking] Scroll tracking initialized")
  }, [trackEvent, trackScroll])

  return {
    trackVideoView,
    trackScroll,
    initScrollTracking
  }
}

// Exportar funções individuais para compatibilidade com código existente
export function trackVideoView(params: VideoViewParams): void {
  if (typeof window === 'undefined') return

  console.warn("[DEPRECATED] Use useEventTracking() hook instead of direct function call")
  
  // Fallback para código existente
  if (typeof window !== 'undefined' && window.sendMetaEvent) {
    const eventData = {
      content_type: "video",
      content_name: params.video_title || "Video Content",
      content_url: params.video_url || window.location.href,
      video_duration: params.video_duration,
      video_percent: params.video_percent,
      video_status: params.video_status,
      value: params.video_status === "completed" ? 1 : 0.1,
      currency: "BRL",
    }
    
    window.sendMetaEvent("VideoView", eventData)
  }
}

export function trackScroll(params: ScrollParams): void {
  if (typeof window === 'undefined') return

  console.warn("[DEPRECATED] Use useEventTracking() hook instead of direct function call")
  
  // Fallback para código existente
  if (typeof window !== 'undefined' && window.sendMetaEvent) {
    const eventData = {
      content_type: "scroll",
      content_name: params.content_name || (typeof document !== 'undefined' ? document.title : ''),
      content_url: params.page_url || window.location.href,
      scroll_depth: params.scroll_depth,
      scroll_position: params.scroll_position,
      page_height: params.page_height,
      value: params.scroll_depth >= 90 ? 0.5 : 0.1,
      currency: "BRL",
    }
    
    window.sendMetaEvent("Scroll", eventData)
  }
}

// Adicionar declaração de tipo para a window global
declare global {
  interface Window {
    sendMetaEvent?: (eventName: string, params?: Record<string, any>, options?: { eventID?: string; user_data?: Record<string, any> }) => void
  }
}

