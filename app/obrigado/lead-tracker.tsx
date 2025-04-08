"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { scoreToMonetaryValue } from "@/lib/lead-scoring"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { prepareUserData } from "@/lib/meta-utils"
import { sendGA4Event, sendMeasurementProtocolEvent } from "@/lib/ga4/events"

export default function LeadTracker() {
  useEffect(() => {
    // Processamos o evento Lead apenas quando a página de obrigado é carregada
    const processPendingLeadEvent = () => {
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
        
        console.log('[Lead Tracker] Processando evento Lead na página de obrigado', {
          eventId: metaEventId,
          qualified: leadData.qualified || false,
          score: leadData.lead_score || 0,
          details: leadData.qualification_details || {}
        });
        
        // Enviar evento Lead (Meta)
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          // Calcular valor com base no score (0 para leads não qualificados)
          const isQualified = leadData.qualified !== false;
          const score = isQualified ? (leadData.lead_score || 1) : 0;
          const value = leadData.value || scoreToMonetaryValue(score);
          
          // Preparar dados do usuário com nome, email e telefone hasheados
          const metaUserData = prepareUserData({
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name,
            fbc: leadData.fbc,
            fbp: leadData.fbp
          });
          
          // Verificar se o userData foi preparado corretamente
          console.log('[Lead Tracker] Dados de usuário preparados:', {
            hasEmail: !!metaUserData.em,
            hasPhone: !!metaUserData.ph,
            hasName: !!(metaUserData.fn || metaUserData.ln),
            hasFbp: !!metaUserData.fbp,
            hasFbc: !!metaUserData.fbc
          });
          
          // Dados para o evento Lead
          const metaEventData = {
            value: value,
            currency: 'BRL',
            content_name: 'Reunião Agendada',
            content_category: 'Lead Qualification',
            qualification_status: isQualified ? 'qualified' : 'unqualified',
            lead_score: score,
            // Dados adicionais para enriquecer os parâmetros
            form_type: leadData.form_type || 'whatsapp_form',
            source: leadData.source || 'website'
          };
          
          // Log detalhado antes do envio
          console.log('[Lead Tracker] Dados completos do evento Lead:', {
            eventId: metaEventId,
            value,
            qualification_status: isQualified ? 'qualified' : 'unqualified',
            score,
            // Adicionar logs detalhados dos dados do usuário
            hasUserData: true,
            userData: {
              hasEmail: !!leadData.email,
              hasName: !!leadData.name,
              hasPhone: !!leadData.phone,
              hasFbc: !!leadData.fbc,
              hasFbp: !!leadData.fbp
            },
            // Logs detalhados do userData processado
            processedUserData: {
              hasEmailHash: !!metaUserData.em,
              hasPhoneHash: !!metaUserData.ph,
              hasNameHash: !!(metaUserData.fn || metaUserData.ln)
            }
          });
          
          // Enviar evento Lead
          window.sendMetaEvent(
            'Lead', 
            metaEventData, 
            { 
              user_data: metaUserData,
              eventID: metaEventId 
            }
          );
          
          console.log('[Lead Tracker] Evento Lead Meta enviado:', {
            eventId: metaEventId,
            leadScore: score,
            isQualified,
            hasEmail: !!metaUserData.em,
            hasPhone: !!metaUserData.ph,
            phoneHash: metaUserData.ph?.[0]?.substring(0, 8) + "..."
          });
          
          // Marcar evento Meta como enviado
          markEventAsSent("Lead", leadIdentifier, { eventId: metaEventId, score, qualified: isQualified });
          
          // --- Envio GA4 (novo) ---
          // Mapear parâmetros Meta para GA4
          const ga4EventParams = {
            value: value, // Usar o mesmo valor calculado
            currency: 'BRL', // Usar a mesma moeda
            item_name: metaEventData.content_name, // Mapear content_name para item_name
            item_category: metaEventData.content_category, // Mapear content_category
            qualification_status: metaEventData.qualification_status, // Parâmetro customizado
            lead_score: score, // Parâmetro customizado
            form_type: metaEventData.form_type, // Parâmetro customizado
            source: metaEventData.source // Parâmetro customizado
            // transaction_id: metaEventId // Opcional: Usar ID do evento Meta como ID de transação?
          };

          // Enviar evento GA4 via gtag (cliente)
          // Usar o mesmo identificador do Meta para deduplicação GA4
          sendGA4Event('Lead', ga4EventParams, leadIdentifier);

          // Preparar dados para Measurement Protocol
          const ga4MpEventData = {
              // non_personalized_ads: false, // Opcional
              // user_properties: { ... } // Opcional
              events: [{
                  name: 'Lead',
                  params: {
                      ...ga4EventParams,
                      // Parâmetros adicionais específicos do servidor, se houver
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
              // Garantir que os dados do usuário sejam incluídos
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
        
        // Limpar os dados pendentes após processamento
        localStorage.removeItem('pendingLeadEvent');
        
      } catch (error) {
        console.error('[Lead Tracker] Erro ao processar evento Lead:', error);
      }
    };
    
    // Executar após um pequeno atraso para garantir que a página carregou completamente
    const timerId = setTimeout(processPendingLeadEvent, 2000);
    
    return () => clearTimeout(timerId);
  }, []);

  return null;
} 