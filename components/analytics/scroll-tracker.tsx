"use client"

import { useEffect } from 'react'
import { sendGA4Event, sendMeasurementProtocolEvent } from '@/lib/ga4/events'
import { isEventAlreadySent, markEventAsSent, clearSentEvents } from "@/lib/event-deduplication"

/**
 * Componente que rastreia o progresso de scroll da página e dispara
 * eventos GA4 nos mesmos pontos que o Meta Pixel (25%, 50%, 75%, 90%)
 */
export default function ScrollTracker() {
  useEffect(() => {
    // Pontos de scroll a serem rastreados (mesmos do Meta)
    const scrollPoints = [25, 50, 75, 90]
    // Armazenar pontos já registrados para evitar disparos duplicados
    const trackedScrollPoints = new Set<number>()
    // ID da página atual para deduplicação
    const pageIdentifier = window.location.pathname
    
    // FIXME: Reset temporário do estado de deduplicação para fins de diagnóstico
    // Isso deve ser removido após o diagóstico
    console.log("[ScrollTracker] Limpando estado de deduplicação para scroll");
    clearSentEvents('GA4', 'scroll');
    
    // Função para verificar e logar os eventos armazenados no localStorage
    const logLocalStorageState = () => {
      try {
        console.log("[ScrollTracker] Conteúdo do localStorage:");
        console.log("_ga4_events_sent:", localStorage.getItem('_ga4_events_sent'));
        console.log("_meta_events_sent:", localStorage.getItem('_meta_events_sent'));
      } catch (e) {
        console.error("[ScrollTracker] Erro ao acessar localStorage:", e);
      }
    };
    
    // Log inicial do estado
    logLocalStorageState();

    const handleScroll = () => {
      try {
        // Calcular a porcentagem de scroll
        const scrolled = Math.floor(
          (window.scrollY / 
            (document.documentElement.scrollHeight - window.innerHeight)) * 100
        )

        // Verificar se atingimos algum ponto de scroll não registrado
        for (const point of scrollPoints) {
          if (scrolled >= point && !trackedScrollPoints.has(point)) {
            const scrollIdentifier = `scroll_${pageIdentifier}_${point}`

            // Verificar se já foi enviado nesta sessão (prevenir duplicatas em reloads)
            if (isEventAlreadySent("scroll", scrollIdentifier)) {
              console.log(`[ScrollTracker] Evento de ${point}% já enviado para esta página. Ignorando.`);
              trackedScrollPoints.add(point);
              // Log do estado atual do localStorage após verificação
              logLocalStorageState();
              continue;
            }

            console.log(`[ScrollTracker] Rastreando scroll de ${point}%`);
            trackedScrollPoints.add(point);

            // 1. Envio para Meta (se disponível)
            if (typeof window.sendMetaEvent === 'function') {
              const metaEventId = (window as any).generateEventId?.() || `scroll_${Date.now()}`
              
              window.sendMetaEvent(
                'Scroll',
                {
                  percent_scroll: point,
                  page_url: window.location.href,
                  page_title: document.title,
                },
                { eventID: metaEventId }
              )
              
              console.log(`[ScrollTracker] Evento Meta 'Scroll ${point}%' enviado com ID: ${metaEventId}`)
            }

            // 2. Envio para GA4 via gtag
            const ga4EventParams = {
              percent_scrolled: point,
              page_title: document.title,
              page_location: window.location.href,
              page_path: window.location.pathname,
            }
            
            console.log(`[ScrollTracker] Preparando envio GA4 (gtag) para ${point}%...`, ga4EventParams);
            sendGA4Event('scroll', ga4EventParams, scrollIdentifier)
            console.log(`[ScrollTracker] Chamada sendGA4Event (gtag) para ${point}% realizada.`);

            // 3. Envio para GA4 Measurement Protocol
            const ga4MpEventData = {
              events: [{
                name: 'scroll',
                params: {
                  ...ga4EventParams,
                  // Parâmetros adicionais específicos do servidor, se necessário
                }
              }]
            }
            
            console.log(`[ScrollTracker] Preparando envio GA4 (MP) para ${point}%...`, ga4MpEventData);
            sendMeasurementProtocolEvent(ga4MpEventData)
            console.log(`[ScrollTracker] Chamada sendMeasurementProtocolEvent (MP) para ${point}% realizada.`);
            
            // Marcar como enviado
            markEventAsSent("Scroll", scrollIdentifier, undefined, 'META');
            markEventAsSent("scroll", scrollIdentifier, undefined, 'GA4');
            
            // Log do estado após marcar o evento como enviado
            logLocalStorageState();
          }
        }
      } catch (error) {
        console.error('[ScrollTracker] Erro ao processar evento de scroll:', error)
      }
    }

    // Usar throttling para limitar a frequência das chamadas durante o scroll
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Adicionar event listener
    window.addEventListener('scroll', throttledHandleScroll)

    // Limpeza
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [])

  // Componente não renderiza nada visualmente
  return null
} 