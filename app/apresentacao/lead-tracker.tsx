"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"

export default function LeadTracker() {
  useEffect(() => {
    // Processamos o evento ViewContent apenas quando a página de apresentação é carregada
    const processViewContentEvent = () => {
      try {
        // Identificador único para esta página
        const contentIdentifier = `view_content_apresentacao`;
        
        // Verificar se o evento já foi enviado recentemente
        if (isEventAlreadySent("ViewContent", contentIdentifier)) {
          console.log("[ViewContent Tracker] Evento ViewContent já enviado anteriormente para esta página, ignorando");
          return;
        }
        
        // Gerar ID de evento único para deduplicação
        const eventId = generateEventId();
        
        console.log('[ViewContent Tracker] Processando evento ViewContent na página de apresentação', {
          eventId,
          contentIdentifier
        });
        
        // Enviar evento ViewContent quando a página é carregada
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          // Obter parâmetros do Meta
          const metaParams = getMetaParams();
          
          // Verificar se temos dados do formulário preenchido
          let formData: Record<string, string> = {};
          try {
            const storedData = localStorage.getItem('pendingLeadEvent');
            if (storedData) {
              formData = JSON.parse(storedData);
              console.log('[ViewContent Tracker] Dados do formulário encontrados no localStorage', {
                hasName: !!formData.name,
                hasEmail: !!formData.email,
                hasPhone: !!formData.phone
              });
            }
          } catch (e) {
            console.error('[ViewContent Tracker] Erro ao ler dados do localStorage:', e);
          }
          
          // Preparar dados do usuário com nome, email e telefone (se disponíveis)
          const userData = prepareUserData({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            fbc: metaParams.fbc || formData.fbc,
            fbp: metaParams.fbp || formData.fbp
          });
          
          const eventData = {
            content_name: "Apresentação VFX",
            content_category: "Video Presentation",
            content_type: "video_presentation",
            content_ids: ["apresentacao-vfx"],
            currency: 'BRL'
          };
          
          // Log detalhado antes do envio
          console.log('[ViewContent Tracker] Dados completos do evento:', {
            eventId,
            ...eventData,
            hasUserData: true,
            userData: {
              hasFbc: !!metaParams.fbc,
              hasFbp: !!metaParams.fbp
            }
          });
          
          // Primeiro API, depois Pixel (ordem importante)
          window.sendMetaEvent(
            'ViewContent', 
            eventData, 
            { 
              user_data: userData,
              eventID: eventId 
            }
          );
          
          console.log('[ViewContent Tracker] Evento ViewContent enviado com sucesso com ID:', eventId);
          
          // Marcar evento como enviado para evitar duplicação
          markEventAsSent("ViewContent", contentIdentifier, { eventId });
        } else {
          console.error('[ViewContent Tracker] window.sendMetaEvent não disponível');
        }
      } catch (error) {
        console.error('[ViewContent Tracker] Erro ao processar evento ViewContent:', error);
      }
    };
    
    // Executar após um pequeno atraso para garantir que a página carregou completamente
    const timerId = setTimeout(processViewContentEvent, 2000);
    
    return () => clearTimeout(timerId);
  }, []);

  return null;
} 