"use client"

import { useCallback, useState, useRef } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"

interface VideoMetadata {
  content_name: string
  content_id: string
  content_url?: string
  content_category?: string
  video_duration: number // em segundos
}

interface VideoTrackingOptions {
  trackProgressIntervals?: boolean
  progressPoints?: number[] // Percentuais de progresso para rastrear (padrão: [0, 25, 50, 75, 100])
  deduplicateInSession?: boolean
  preventMultipleStartEvents?: boolean
}

interface UseVideoTrackingReturn {
  trackStart: () => void
  trackProgress: (percent: number) => void
  trackComplete: () => void
  isTracking: boolean
  trackedProgress: Set<number>
}

// Interface para dados do usuário
interface UserDataInfo {
  email?: string;
  phone?: string;
  name?: string;
  fbc?: string;
  fbp?: string;
}

const DEFAULT_PROGRESS_POINTS = [0, 25, 50, 75, 100]

/**
 * Recupera dados do usuário do localStorage para enriquecer eventos
 */
function getUserDataFromStorage(): UserDataInfo {
  let userDataInfo: UserDataInfo = {};
  
  try {
    // Tentar primeiro o pendingLeadEvent (que contém dados do formulário)
    const pendingData = localStorage.getItem('pendingLeadEvent');
    if (pendingData) {
      const leadData = JSON.parse(pendingData);
      userDataInfo = {
        email: leadData.email,
        phone: leadData.phone,
        name: leadData.name
      };
      console.log('[VideoView] Dados do usuário encontrados em pendingLeadEvent', {
        hasEmail: !!leadData.email,
        hasPhone: !!leadData.phone,
        hasName: !!leadData.name
      });
      return userDataInfo;
    }
    
    // Se não encontrou, tentar o pendingSubmitApplication
    const pendingSubmitData = localStorage.getItem('pendingSubmitApplication');
    if (pendingSubmitData) {
      const submitData = JSON.parse(pendingSubmitData);
      userDataInfo = {
        email: submitData.email,
        phone: submitData.phone,
        name: submitData.name
      };
      console.log('[VideoView] Dados do usuário encontrados em pendingSubmitApplication', {
        hasEmail: !!submitData.email,
        hasPhone: !!submitData.phone,
        hasName: !!submitData.name
      });
      return userDataInfo;
    }
  } catch (e) {
    console.warn('[VideoView] Erro ao ler dados do usuário:', e);
  }
  
  return userDataInfo;
}

/**
 * Hook para rastreamento de eventos de vídeo (VideoView)
 * Implementa rastreamento de início, progresso e conclusão de vídeos
 */
export function useVideoTracking(
  videoMetadata: VideoMetadata,
  options: VideoTrackingOptions = {}
): UseVideoTrackingReturn {
  const {
    trackProgressIntervals = true,
    progressPoints = DEFAULT_PROGRESS_POINTS,
    deduplicateInSession = true,
    preventMultipleStartEvents = true
  } = options
  
  const [isTracking, setIsTracking] = useState(false)
  const trackedProgress = useRef<Set<number>>(new Set())
  
  /**
   * Rastrear início do vídeo (0%)
   */
  const trackStart = useCallback(() => {
    // Verificar se não estamos rastreando este vídeo
    if (preventMultipleStartEvents && isTracking) {
      console.log("[VideoTracking] Vídeo já está sendo rastreado, ignorando evento de início");
      return;
    }
    
    // Verificar se o evento de início já foi enviado recentemente
    const videoIdentifier = `video_${videoMetadata.content_id}_start`;
    if (deduplicateInSession && isEventAlreadySent("VideoView", videoIdentifier)) {
      console.log("[VideoTracking] Evento de início já enviado recentemente, ignorando duplicação");
      return;
    }
    
    // Gerar ID único para deduplicação entre API e Pixel
    const eventId = generateEventId();
    
    // Obter parâmetros do Meta (fbc e fbp)
    const metaParams = getMetaParams();
    
    // Obter dados do usuário do localStorage
    const userDataInfo = getUserDataFromStorage();
    
    // Preparar dados do usuário formatados corretamente
    const userData = prepareUserData({
      ...userDataInfo,
      fbc: metaParams.fbc,
      fbp: metaParams.fbp
    });
    
    // Rastrear início da visualização do vídeo usando sendMetaEvent
    if (typeof window !== "undefined" && window.sendMetaEvent) {
      window.sendMetaEvent("VideoView", {
        ...videoMetadata,
        video_percent: 0,
        video_time: 0,
        video_status: "started",
        currency: "BRL",
        value: 0.1 // Valor atribuído ao início do vídeo
      }, { 
        eventID: eventId,
        user_data: userData
      });
      
      console.log(`[VideoTracking] Início da visualização do vídeo enviado com ID: ${eventId}`, {
        hasUserData: !!userData,
        hasEmail: !!userDataInfo.email,
        hasPhone: !!userDataInfo.phone 
      });
      
      // Marcar evento como enviado
      markEventAsSent("VideoView", videoIdentifier, { eventId });
      
      // Adicionar 0 à lista de progressos rastreados
      trackedProgress.current.add(0);
      
      // Atualizar estado
      setIsTracking(true);
    } else {
      console.warn("[VideoTracking] window.sendMetaEvent não disponível");
    }
  }, [isTracking, videoMetadata, preventMultipleStartEvents, deduplicateInSession]);
  
  /**
   * Rastrear progresso do vídeo em um percentual específico
   */
  const trackProgress = useCallback((percent: number) => {
    // Arredondar percentual para o mais próximo dos pontos de progresso
    const nearestPoint = progressPoints.find(point => 
      Math.abs(point - percent) < 5
    );
    
    // Se não estamos próximos de um ponto de progresso, ignorar
    if (!nearestPoint || !trackProgressIntervals) {
      return;
    }
    
    // Evitar envio duplicado se o mesmo percentual já foi rastreado
    if (trackedProgress.current.has(nearestPoint)) {
      return;
    }
    
    // Verificar se o evento já foi enviado recentemente
    const videoIdentifier = `video_${videoMetadata.content_id}_${nearestPoint}`;
    if (deduplicateInSession && isEventAlreadySent("VideoView", videoIdentifier)) {
      console.log(`[VideoTracking] Evento de progresso ${nearestPoint}% já enviado recentemente, ignorando`);
      return;
    }
    
    // Obter status com base no percentual
    let status = "progress";
    if (nearestPoint === 25) status = "25_watched";
    else if (nearestPoint === 50) status = "50_watched";
    else if (nearestPoint === 75) status = "75_watched";
    else if (nearestPoint >= 95) status = "completed";
    
    // Calcular tempo estimado com base no percentual e duração total
    const estimatedTime = Math.round((nearestPoint / 100) * videoMetadata.video_duration);
    
    // Calcular valor com base no percentual (entre 0.1 e 1.0)
    const value = nearestPoint >= 95 ? 1 : Math.max(0.1, nearestPoint / 100);
    
    // Gerar ID único para deduplicação entre API e Pixel
    const eventId = generateEventId();
    
    // Obter parâmetros do Meta (fbc e fbp)
    const metaParams = getMetaParams();
    
    // Obter dados do usuário do localStorage
    const userDataInfo = getUserDataFromStorage();
    
    // Preparar dados do usuário formatados corretamente
    const userData = prepareUserData({
      ...userDataInfo,
      fbc: metaParams.fbc,
      fbp: metaParams.fbp
    });
    
    if (typeof window !== "undefined" && window.sendMetaEvent) {
      window.sendMetaEvent("VideoView", {
        ...videoMetadata,
        video_percent: nearestPoint,
        video_time: estimatedTime,
        video_status: status,
        currency: "BRL",
        value: value
      }, { 
        eventID: eventId,
        user_data: userData
      });
      
      console.log(`[VideoTracking] Progresso do vídeo (${nearestPoint}%) enviado com ID: ${eventId}`, {
        hasUserData: !!userData,
        hasEmail: !!userDataInfo.email,
        hasPhone: !!userDataInfo.phone
      });
      
      // Marcar este percentual como rastreado
      trackedProgress.current.add(nearestPoint);
      
      // Marcar evento como enviado para evitar duplicação
      markEventAsSent("VideoView", videoIdentifier, { 
        eventId,
        percent: nearestPoint,
        video: videoMetadata.content_id
      });
    }
  }, [videoMetadata, trackProgressIntervals, progressPoints, deduplicateInSession]);
  
  /**
   * Rastrear conclusão do vídeo (100%)
   */
  const trackComplete = useCallback(() => {
    trackProgress(100);
  }, [trackProgress]);
  
  return {
    trackStart,
    trackProgress,
    trackComplete,
    isTracking,
    trackedProgress: trackedProgress.current
  };
} 