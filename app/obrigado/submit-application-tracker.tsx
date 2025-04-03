"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { prepareUserData } from "@/lib/meta-utils"

export default function SubmitApplicationTracker() {
  useEffect(() => {
    // Processamos o evento SubmitApplication apenas para leads qualificados
    const processSubmitApplication = () => {
      try {
        // Verificar se existe dados pendentes
        const pendingData = localStorage.getItem('pendingSubmitApplication');
        
        if (!pendingData) {
          console.log("[SubmitApplication] Nenhum dado pendente encontrado");
          return;
        }
        
        // Deserializar os dados
        const applicationData = JSON.parse(pendingData);
        
        // Verificar se é um lead já processado
        if (!applicationData.processed_lead) {
          console.log("[SubmitApplication] Dados invalidos - Lead não processado");
          localStorage.removeItem('pendingSubmitApplication');
          return;
        }
        
        // Verificar se já foi enviado para evitar duplicação
        const identifier = `submit_application_${applicationData.lead_id || applicationData.email || applicationData.phone}`;
        if (isEventAlreadySent("SubmitApplication", identifier)) {
          console.log("[SubmitApplication] Evento já enviado anteriormente, ignorando");
          localStorage.removeItem('pendingSubmitApplication');
          return;
        }
        
        // Confirmar que o lead é qualificado e tem score > 0
        const leadScore = applicationData.lead_score || 0;
        if (leadScore <= 0 || applicationData.qualification_status !== 'qualified') {
          console.log("[SubmitApplication] Lead não qualificado ou score zero, ignorando", {
            score: leadScore,
            status: applicationData.qualification_status
          });
          localStorage.removeItem('pendingSubmitApplication');
          return;
        }
        
        // Gerar ID de evento único para deduplicação
        const eventId = generateEventId();
        
        console.log('[SubmitApplication] Processando evento para lead qualificado', {
          eventId,
          leadId: applicationData.lead_id,
          score: leadScore
        });
        
        // Enviar evento SubmitApplication
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          // Preparar dados do usuário com nome, email e telefone hasheados
          const userData = prepareUserData({
            email: applicationData.email,
            phone: applicationData.phone,
            name: applicationData.name,
            fbc: applicationData.fbc,
            fbp: applicationData.fbp
          });
          
          // Verificar se o userData foi preparado corretamente
          console.log('[SubmitApplication] Dados de usuário preparados:', {
            hasEmail: !!userData.em,
            hasPhone: !!userData.ph,
            hasName: !!(userData.fn || userData.ln),
            hasFbp: !!userData.fbp,
            hasFbc: !!userData.fbc
          });
          
          // Preparar dados do evento - manter consistência com o evento Lead
          const eventData = {
            value: applicationData.value,
            currency: applicationData.currency || 'BRL',
            content_name: 'Aplicação para Reunião',
            content_category: 'Lead Qualified',
            lead_score: leadScore,
            // Incluir dados do lead para manter consistência
            lead_id: applicationData.lead_id,
            form_type: applicationData.form_type || 'whatsapp_form',
            source: applicationData.source || 'website',
          };
          
          // Log detalhado
          console.log('[SubmitApplication] Dados completos do evento:', {
            eventId,
            leadId: applicationData.lead_id,
            value: applicationData.value,
            score: leadScore,
            // Adicionar logs detalhados dos dados do usuário
            hasUserData: true,
            userData: {
              hasEmail: !!applicationData.email,
              hasName: !!applicationData.name,
              hasPhone: !!applicationData.phone,
              hasFbc: !!applicationData.fbc,
              hasFbp: !!applicationData.fbp
            },
            // Logs detalhados do userData processado
            processedUserData: {
              hasEmailHash: !!userData.em,
              hasPhoneHash: !!userData.ph,
              hasNameHash: !!(userData.fn || userData.ln)
            }
          });
          
          // Primeiro API, depois Pixel (ordem importante)
          window.sendMetaEvent(
            'SubmitApplication', 
            eventData, 
            { 
              user_data: userData,
              eventID: eventId 
            }
          );
          
          console.log('[SubmitApplication] Evento enviado com sucesso com ID:', eventId);
          
          // Marcar evento como enviado
          markEventAsSent("SubmitApplication", identifier, { 
            eventId, 
            leadId: applicationData.lead_id,
            leadScore: leadScore
          });
        } else {
          console.error('[SubmitApplication] window.sendMetaEvent não disponível');
        }
        
        // Limpar dados pendentes
        localStorage.removeItem('pendingSubmitApplication');
        
      } catch (error) {
        console.error('[SubmitApplication] Erro ao processar evento:', error);
      }
    };
    
    // Executar após o Lead Tracker (+ 1 segundo)
    const timerId = setTimeout(processSubmitApplication, 3000);
    
    return () => clearTimeout(timerId);
  }, []);

  return null;
} 