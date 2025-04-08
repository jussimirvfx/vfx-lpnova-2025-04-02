"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"
import { scoreToMonetaryValue } from "@/lib/lead-scoring"
import { sendGA4Event, sendMeasurementProtocolEvent } from "@/lib/ga4/events"

export default function LeadTracker() {
  useEffect(() => {
    // Processamos os eventos quando a página de apresentação é carregada
    const processEvents = async () => {
      // Primeiro processamos o ViewContent
      await processViewContentEvent();
      
      // Depois processamos o evento Lead
      await processLeadEvent();
    }
    
    // Processamos o evento ViewContent apenas quando a página de apresentação é carregada
    const processViewContentEvent = async () => {
      try {
        // Identificador único para esta página
        const contentIdentifier = `view_content_apresentacao`;
        
        // Verificar se o evento já foi enviado recentemente
        if (isEventAlreadySent("ViewContent", contentIdentifier)) {
          console.log("[ViewContent Tracker] Evento ViewContent já enviado anteriormente para esta página, ignorando");
          return;
        }
        
        // Gerar ID de evento único para deduplicação Meta
        const metaEventId = generateEventId();
        
        console.log('[ViewContent Tracker] Processando evento ViewContent Meta na página de apresentação', {
          eventId: metaEventId,
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
          const metaUserData = prepareUserData({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            fbc: metaParams.fbc || formData.fbc,
            fbp: metaParams.fbp || formData.fbp
          });
          
          const metaEventData = {
            content_name: "Apresentação VFX",
            content_category: "Video Presentation",
            content_type: "video_presentation",
            content_ids: ["apresentacao-vfx"],
            currency: 'BRL'
          };
          
          // Log detalhado antes do envio
          console.log('[ViewContent Tracker] Dados completos do evento:', {
            eventId: metaEventId,
            ...metaEventData,
            hasUserData: true,
            userData: {
              hasFbc: !!metaParams.fbc,
              hasFbp: !!metaParams.fbp
            }
          });
          
          // Primeiro API, depois Pixel (ordem importante)
          window.sendMetaEvent(
            'ViewContent', 
            metaEventData, 
            { 
              user_data: metaUserData,
              eventID: metaEventId 
            }
          );
          
          console.log('[ViewContent Tracker] Evento ViewContent Meta enviado com sucesso com ID:', metaEventId);
          
          // Marcar evento Meta como enviado
          markEventAsSent("ViewContent", contentIdentifier, { eventId: metaEventId });

          // --- Envio GA4 (novo) ---
          // Mapear parâmetros Meta para GA4 (evento view_item)
          const ga4EventParams = {
              currency: metaEventData.currency,
              value: 0, // ViewContent geralmente não tem valor, mas GA4 recomenda enviar 0
              items: [{
                  item_id: metaEventData.content_ids[0], // Mapear content_ids
                  item_name: metaEventData.content_name, // Mapear content_name
                  item_category: metaEventData.content_category, // Mapear content_category
                  // Outros parâmetros de item se aplicável (ex: price, quantity)
              }]
              // Adicionar outros parâmetros GA4 relevantes se necessário
          };

          // Enviar evento GA4 via gtag (cliente)
          // Usar o mesmo identificador do Meta para deduplicação GA4
          sendGA4Event('view_item', ga4EventParams, contentIdentifier);

          // Preparar dados para Measurement Protocol
          const ga4MpEventData = {
              // non_personalized_ads: false, // Opcional
              // user_properties: { ... } // Opcional
              events: [{
                  name: 'view_item',
                  params: {
                      ...ga4EventParams,
                      // Parâmetros adicionais específicos do servidor, se houver
                      // Não enviar PII
                  }
              }]
          };
          // Não enviamos ViewContent/view_item via MP por padrão, pois geralmente é menos crítico
          // e já capturado pelo gtag. Descomente a linha abaixo se quiser enviar mesmo assim.
          // sendMeasurementProtocolEvent(ga4MpEventData);
          // --- Fim Envio GA4 ---

        } else {
          console.error('[ViewContent Tracker] window.sendMetaEvent não disponível');
        }
      } catch (error) {
        console.error('[ViewContent Tracker] Erro ao processar evento ViewContent:', error);
      }
    };
    
    // Processamos o evento Lead para o formulário de apresentação
    const processLeadEvent = async () => {
      try {
        // Verificar se existe um evento Lead pendente
        const pendingLeadEventData = localStorage.getItem('pendingLeadEvent');
        
        if (!pendingLeadEventData) {
          console.log("[Lead Tracker] Nenhum evento Lead pendente encontrado");
          return;
        }
        
        // Deserializar os dados do evento
        const leadData = JSON.parse(pendingLeadEventData);
        
        // Verificar se o lead já foi processado
        const leadIdentifier = `lead_${leadData.email || leadData.phone || Date.now()}`;
        if (isEventAlreadySent("Lead", leadIdentifier)) {
          console.log("[Lead Tracker] Evento Lead já enviado anteriormente para este usuário, ignorando");
          // Limpar os dados pendentes, mesmo se já processado
          localStorage.removeItem('pendingLeadEvent');
          return;
        }
        
        // Gerar ID de evento para deduplicação Meta
        const metaEventId = generateEventId();
        
        console.log('[Lead Tracker] Processando evento Lead Meta na página de apresentação', {
          eventId: metaEventId,
          qualified: leadData.qualified || false,
          score: leadData.lead_score || 0,
          details: leadData.qualification_details || {}
        });
        
        // Enviar evento Lead (Meta)
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          const isQualified = leadData.qualified !== false;
          const score = isQualified ? (leadData.lead_score || 1) : 0;
          const value = leadData.value || scoreToMonetaryValue(score);
          const metaUserData = prepareUserData({
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name,
            fbc: leadData.fbc,
            fbp: leadData.fbp
          });

          const metaEventData = {
            value: value,
            currency: 'BRL',
            content_name: 'Apresentação Agendada',
            content_category: 'Lead Qualification',
            qualification_status: isQualified ? 'qualified' : 'unqualified',
            lead_score: score,
            form_type: leadData.form_type || 'formulario_apresentacao',
            source: leadData.source || 'website'
          };

          // --- Envio Meta (existente) ---
          window.sendMetaEvent(
            'Lead',
            metaEventData,
            { user_data: metaUserData, eventID: metaEventId }
          );
          console.log('[Lead Tracker] Evento Lead Meta enviado:', {
            eventId: metaEventId,
            leadScore: score,
            isQualified,
            hasEmail: !!leadData.email,
            hasPhone: !!leadData.phone,
            phoneHash: leadData.phone?.[0]?.substring(0, 8) + "..."
          });

          // Marcar evento Meta como enviado
          markEventAsSent("Lead", leadIdentifier, { eventId: metaEventId, score, qualified: isQualified });

          // --- Envio GA4 (novo) ---
          // Mapear parâmetros Meta para GA4 (evento generate_lead)
          const ga4EventParams = {
            value: value,
            currency: 'BRL',
            item_name: metaEventData.content_name,
            item_category: metaEventData.content_category,
            qualification_status: metaEventData.qualification_status,
            lead_score: score,
            form_type: metaEventData.form_type,
            source: metaEventData.source
          };

          // Enviar evento GA4 via gtag (cliente)
          sendGA4Event('generate_lead', ga4EventParams, leadIdentifier);

          // Preparar dados para Measurement Protocol
          const ga4MpEventData = {
              // non_personalized_ads: false,
              // user_properties: { ... },
              events: [{
                  name: 'generate_lead',
                  params: {
                      ...ga4EventParams,
                      // Parâmetros adicionais do servidor, se houver
                      // Não enviar PII
                  }
              }]
          };

          // Enviar evento GA4 via Measurement Protocol (servidor)
          sendMeasurementProtocolEvent(ga4MpEventData);
          // --- Fim Envio GA4 ---

          // Armazenar dados para o evento SubmitApplication
          if (isQualified && score > 0) {
            localStorage.setItem('pendingSubmitApplication', JSON.stringify({
              ...metaEventData,
              email: leadData.email,
              name: leadData.name,
              phone: leadData.phone,
              fbc: leadData.fbc,
              fbp: leadData.fbp,
              lead_id: metaEventId,
              processed_lead: true
            }));
            
            console.log('[Lead Tracker] Dados para SubmitApplication armazenados:', {
              leadId: metaEventId,
              score,
              value: value,
              hasEmail: !!leadData.email,
              hasPhone: !!leadData.phone,
              hasName: !!leadData.name
            });
          }
        } else {
          console.error('[Lead Tracker] window.sendMetaEvent não disponível');
        }
        
        // Não limpar os dados pendentes após processamento, pois podem ser necessários para reprocessamento
        // Apenas marcar como enviado para evitar duplicação
      } catch (error) {
        console.error('[Lead Tracker] Erro ao processar evento Lead:', error);
      }
    };
    
    // Executar após um pequeno atraso para garantir que a página carregou completamente
    const timerId = setTimeout(processEvents, 2000);
    
    return () => clearTimeout(timerId);
  }, []);

  return null;
} 