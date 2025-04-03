"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { scoreToMonetaryValue } from "@/lib/lead-scoring"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { prepareUserData } from "@/lib/meta-utils"

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
        
        // Gerar ID de evento para deduplicação
        const eventId = generateEventId();
        
        console.log('[Lead Tracker] Processando evento Lead na página de obrigado', {
          eventId,
          qualified: leadData.qualified || false,
          score: leadData.lead_score || 0,
          details: leadData.qualification_details || {}
        });
        
        // Enviar evento Lead (mesmo para leads não qualificados, mas com valor diferente)
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          // Calcular valor com base no score (0 para leads não qualificados)
          const isQualified = leadData.qualified !== false;
          const score = isQualified ? (leadData.lead_score || 1) : 0;
          const value = leadData.value || scoreToMonetaryValue(score);
          
          // Preparar dados do usuário com nome, email e telefone hasheados
          const userData = prepareUserData({
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name,
            fbc: leadData.fbc,
            fbp: leadData.fbp
          });
          
          // Verificar se o userData foi preparado corretamente
          console.log('[Lead Tracker] Dados de usuário preparados:', {
            hasEmail: !!userData.em,
            hasPhone: !!userData.ph,
            hasName: !!(userData.fn || userData.ln),
            hasFbp: !!userData.fbp,
            hasFbc: !!userData.fbc
          });
          
          // Dados para o evento Lead
          const eventData = {
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
            eventId,
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
              hasEmailHash: !!userData.em,
              hasPhoneHash: !!userData.ph,
              hasNameHash: !!(userData.fn || userData.ln)
            }
          });
          
          // Enviar evento Lead
          window.sendMetaEvent(
            'Lead', 
            eventData, 
            { 
              user_data: userData,
              eventID: eventId 
            }
          );
          
          console.log('[Lead Tracker] Evento Lead enviado:', {
            eventId,
            leadScore: score,
            isQualified,
            hasEmail: !!userData.em,
            hasPhone: !!userData.ph,
            phoneHash: userData.ph?.[0]?.substring(0, 8) + "..."
          });
          
          // Marcar evento como enviado para evitar duplicação
          markEventAsSent("Lead", leadIdentifier, { 
            eventId,
            score,
            qualified: isQualified 
          });
          
          // Armazenar dados para o evento SubmitApplication
          if (isQualified && score > 0) {
            localStorage.setItem('pendingSubmitApplication', JSON.stringify({
              ...eventData,
              // Garantir que os dados do usuário sejam incluídos
              email: leadData.email,
              name: leadData.name,
              phone: leadData.phone,
              fbc: leadData.fbc,
              fbp: leadData.fbp,
              lead_id: eventId,
              processed_lead: true
            }));
            
            console.log('[Lead Tracker] Dados para SubmitApplication armazenados:', {
              leadId: eventId,
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