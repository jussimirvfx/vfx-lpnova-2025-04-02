"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"

export default function ClientPageView() {
  useEffect(() => {
    // Função para rastreamento de PageView
    const trackPageView = async () => {
      try {
        if (typeof window !== "undefined") {
          // Verificar se o fbq está disponível
          if (window.fbq) {
            // Gerar ID único para deduplicação
            const eventId = generateEventId();
            
            // Log para validação
            console.log("[PageView] Enviando PageView para a página de apresentação", {
              path: window.location.pathname,
              eventId
            });
            
            // Enviar evento via Meta Pixel
            if (window.sendMetaEvent) {
              window.sendMetaEvent("PageView", {
                page_path: window.location.pathname,
                page_title: document.title,
                page_location: window.location.href,
              }, { eventID: eventId });
              
              console.log('[PageView] Evento enviado com sucesso via sendMetaEvent')
            } else {
              // Fallback usando a função fbq diretamente
              window.fbq("track", "PageView");
              console.log('[PageView] Evento enviado com sucesso via fbq diretamente')
            }
          } else {
            console.warn("[PageView] Pixel do Facebook não disponível");
          }
        }
      } catch (error) {
        console.error("[PageView] Erro ao rastrear PageView:", error);
      }
    };

    // Rastrear visualização de página imediatamente
    trackPageView();
  }, []);

  return null;
} 