"use client"

import { useEffect, useRef } from 'react'
import { sendGA4Event, sendMeasurementProtocolEvent } from '@/lib/ga4/events'
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"

interface VideoTrackerProps {
  /** Seletor CSS para os elementos de vídeo a serem rastreados */
  selector?: string;
  /** Title do vídeo (opcional, usa o data-title do elemento se não for fornecido) */
  videoTitle?: string;
  /** Provider do vídeo (opcional) */
  videoProvider?: string;
}

/**
 * Componente que rastreia o progresso de reprodução de vídeos e dispara
 * eventos GA4 nos mesmos pontos que o Meta Pixel (25%, 50%, 75%, 100%)
 */
export default function VideoTracker({
  selector = 'video',
  videoTitle,
  videoProvider = 'website'
}: VideoTrackerProps) {
  const trackedPoints = useRef<Map<HTMLVideoElement, Set<number>>>(new Map())
  
  useEffect(() => {
    // Pontos de progresso a serem rastreados (mesmos do Meta)
    const progressPoints = [25, 50, 75, 100]
    
    // Função para lidar com o timeupdate do vídeo
    const handleTimeUpdate = (video: HTMLVideoElement) => {
      try {
        if (video.paused || video.duration === 0 || video.buffering) {
          return // Ignorar se o vídeo estiver pausado, sem duração ou em buffer
        }

        // Obter progresso atual em porcentagem
        const currentTimePercent = Math.floor((video.currentTime / video.duration) * 100)
        
        // Verificar se já inicializamos o conjunto de pontos rastreados para este vídeo
        if (!trackedPoints.current.has(video)) {
          trackedPoints.current.set(video, new Set())
        }

        const videoPointsTracked = trackedPoints.current.get(video) as Set<number>
        
        // Identificador único para o vídeo
        const videoId = video.id || video.getAttribute('data-id') || 'default_video'
        const title = videoTitle || video.getAttribute('data-title') || 'Vídeo'
        
        // Verificar se atingimos algum ponto de progresso
        for (const point of progressPoints) {
          // Verificar se está no ponto de progresso e ainda não foi rastreado
          if (currentTimePercent >= point && !videoPointsTracked.has(point)) {
            const videoIdentifier = `video_${videoId}_${point}`
            
            // Verificar se já foi enviado nesta sessão (prevenir duplicatas em recarregamentos)
            if (isEventAlreadySent("VideoPlay", videoIdentifier)) {
              console.log(`[VideoTracker] Evento de ${point}% já enviado para este vídeo. Ignorando.`)
              videoPointsTracked.add(point)
              continue
            }
            
            console.log(`[VideoTracker] Rastreando progresso de vídeo ${point}%`)
            videoPointsTracked.add(point)
            
            // Determinar o status do progresso (para Meta e GA4)
            let videoStatus: string
            let eventName = 'video_progress'
            
            if (point === 0) {
              videoStatus = 'started'
              eventName = 'video_start'
            } else if (point === 100) {
              videoStatus = 'completed'
              eventName = 'video_complete'
            } else {
              videoStatus = `${point}_watched`
            }
            
            // 1. Envio para Meta (se disponível)
            if (typeof window.sendMetaEvent === 'function') {
              const metaEventId = (window as any).generateEventId?.() || `video_${Date.now()}`
              
              window.sendMetaEvent(
                'VideoPlay',
                {
                  content_name: title,
                  video_percent: point,
                  video_time: Math.floor(video.currentTime),
                  video_duration: Math.floor(video.duration),
                  video_status: videoStatus
                },
                { eventID: metaEventId }
              )
              
              console.log(`[VideoTracker] Evento Meta 'VideoPlay ${point}%' enviado com ID: ${metaEventId}`)
            }
            
            // 2. Envio para GA4 via gtag (cliente)
            const ga4EventParams = {
              video_title: title,
              video_provider: videoProvider,
              video_status: videoStatus,
              video_current_time: Math.floor(video.currentTime),
              video_duration: Math.floor(video.duration),
              video_percent: point
            }
            
            sendGA4Event(eventName, ga4EventParams, videoIdentifier)
            
            // 3. Envio para GA4 Measurement Protocol (servidor)
            const ga4MpEventData = {
              events: [{
                name: eventName,
                params: {
                  ...ga4EventParams,
                  // Parâmetros adicionais específicos do servidor, se necessário
                }
              }]
            }
            
            sendMeasurementProtocolEvent(ga4MpEventData)
            
            // Marcar como enviado para evitar duplicatas
            markEventAsSent("VideoPlay", videoIdentifier)
          }
        }
      } catch (error) {
        console.error('[VideoTracker] Erro ao processar progresso de vídeo:', error)
      }
    }
    
    // Inicialização - selecionar todos os vídeos na página
    const videos = document.querySelectorAll<HTMLVideoElement>(selector)
    const videoElements: HTMLVideoElement[] = Array.from(videos)
    
    // Verificar se há vídeos na página
    if (videoElements.length === 0) {
      console.log('[VideoTracker] Nenhum vídeo encontrado com o seletor:', selector)
    } else {
      console.log(`[VideoTracker] Rastreando ${videoElements.length} vídeos`)
    }
    
    // Adicionar event listeners para cada vídeo
    videoElements.forEach(video => {
      // Criar uma função de callback específica para este vídeo
      const timeUpdateHandler = () => handleTimeUpdate(video)
      
      // Armazenar o handler no elemento para poder removê-lo depois
      video.timeUpdateHandler = timeUpdateHandler
      
      // Adicionar o listener para o evento timeupdate
      video.addEventListener('timeupdate', timeUpdateHandler)
      
      // Também rastrear o início da reprodução (ponto 0%)
      const playHandler = () => {
        const videoId = video.id || video.getAttribute('data-id') || 'default_video'
        const title = videoTitle || video.getAttribute('data-title') || 'Vídeo'
        const videoIdentifier = `video_${videoId}_start`
        
        if (!isEventAlreadySent("VideoPlay", videoIdentifier)) {
          console.log('[VideoTracker] Vídeo iniciado')
          
          // Enviar para Meta
          if (typeof window.sendMetaEvent === 'function') {
            const metaEventId = (window as any).generateEventId?.() || `video_${Date.now()}`
            
            window.sendMetaEvent(
              'VideoPlay',
              {
                content_name: title,
                video_percent: 0,
                video_time: 0,
                video_duration: Math.floor(video.duration),
                video_status: 'started'
              },
              { eventID: metaEventId }
            )
          }
          
          // Enviar para GA4
          const ga4EventParams = {
            video_title: title,
            video_provider: videoProvider,
            video_status: 'started',
            video_current_time: 0,
            video_duration: Math.floor(video.duration || 0),
            video_percent: 0
          }
          
          sendGA4Event('video_start', ga4EventParams, videoIdentifier)
          
          markEventAsSent("VideoPlay", videoIdentifier)
        }
      }
      
      // Armazenar e adicionar o handler de play
      video.playHandler = playHandler
      video.addEventListener('play', playHandler)
    })
    
    // Limpeza
    return () => {
      videoElements.forEach(video => {
        if (video.timeUpdateHandler) {
          video.removeEventListener('timeupdate', video.timeUpdateHandler)
        }
        if (video.playHandler) {
          video.removeEventListener('play', video.playHandler)
        }
      })
    }
  }, [selector, videoTitle, videoProvider])
  
  // Componente não renderiza nada visualmente
  return null
}

// Estender a interface do HTMLVideoElement para incluir nossas propriedades
declare global {
  interface HTMLVideoElement {
    timeUpdateHandler?: () => void;
    playHandler?: () => void;
    buffering?: boolean;
  }
} 