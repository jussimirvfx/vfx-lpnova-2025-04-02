"use client"

import { useEffect } from "react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { prepareUserData } from "@/lib/meta-utils"
import { sendGA4Event, sendMeasurementProtocolEvent } from "@/lib/ga4/events"

export default function SubmitApplicationTracker() {
  useEffect(() => {
    // Processamos o evento SubmitApplication apenas para leads qualificados
    const processSubmitApplication = async () => {
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
        
        // Gerar ID de evento único para deduplicação Meta
        const metaEventId = generateEventId();
        
        console.log('[SubmitApplication] Processando evento Meta para lead qualificado', {
          eventId: metaEventId,
          leadId: applicationData.lead_id,
          score: leadScore,
          formType: applicationData.form_type || 'não especificado'
        });
        
        // Verificar explicitamente se o GA4 está pronto
        if (typeof window === 'undefined' || typeof (window as any).gtag !== 'function') {
          console.error('[SubmitApp Tracker] gtag não está disponível. Tentando novamente em 2 segundos...');
          setTimeout(processSubmitApplication, 2000);
          return;
        }
        
        // Enviar evento SubmitApplication (Meta)
        if (typeof window !== 'undefined' && window.sendMetaEvent) {
          // Preparar dados do usuário com nome, email e telefone hasheados
          const metaUserData = prepareUserData({
            email: applicationData.email,
            phone: applicationData.phone,
            name: applicationData.name,
            fbc: applicationData.fbc,
            fbp: applicationData.fbp
          });
          
          // Verificar se o userData foi preparado corretamente
          console.log('[SubmitApplication] Dados de usuário preparados:', {
            hasEmail: !!metaUserData.em,
            hasPhone: !!metaUserData.ph,
            hasName: !!(metaUserData.fn || metaUserData.ln),
            hasFbp: !!metaUserData.fbp,
            hasFbc: !!metaUserData.fbc
          });
          
          // Determinar o nome do conteúdo com base no tipo de formulário
          let contentName = 'Aplicação para Reunião';
          if (applicationData.form_type === 'formulario_apresentacao') {
            contentName = 'Aplicação para Apresentação';
          }
          
          // Preparar dados do evento - manter consistência com o evento Lead
          const metaEventData = {
            value: applicationData.value,
            currency: applicationData.currency || 'BRL',
            content_name: contentName,
            content_category: 'Lead Qualified',
            lead_score: leadScore,
            // Incluir dados do lead para manter consistência
            lead_id: applicationData.lead_id,
            form_type: applicationData.form_type || 'whatsapp_form',
            source: applicationData.source || 'website',
          };
          
          // Log detalhado
          console.log('[SubmitApplication] Dados completos do evento:', {
            eventId: metaEventId,
            leadId: applicationData.lead_id,
            value: applicationData.value,
            score: leadScore,
            formType: applicationData.form_type,
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
              hasEmailHash: !!metaUserData.em,
              hasPhoneHash: !!metaUserData.ph,
              hasNameHash: !!(metaUserData.fn || metaUserData.ln)
            }
          });
          
          // Primeiro API, depois Pixel (ordem importante)
          window.sendMetaEvent(
            'SubmitApplication', 
            metaEventData, 
            { 
              user_data: metaUserData,
              eventID: metaEventId 
            }
          );
          
          console.log('[SubmitApplication] Evento Meta enviado com sucesso com ID:', metaEventId);
          
          // Marcar evento Meta como enviado
          markEventAsSent("SubmitApplication", identifier, { eventId: metaEventId, leadId: applicationData.lead_id, leadScore: leadScore });

          // --- Envio GA4 (novo) ---
          // Marcamos explicitamente um pequeno atraso para garantir que o GA4 está 100% inicializado
          console.log('[SubmitApp Tracker] Aguardando 500ms antes de enviar os eventos GA4...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mapear parâmetros Meta para GA4
          const ga4EventParams = {
              method: applicationData.form_type === 'formulario_apresentacao' ? 'Presentation Form' : 'Contact Form', // Exemplo de mapeamento
              value: metaEventData.value, // Usar o mesmo valor
              currency: metaEventData.currency, // Usar a mesma moeda
              item_name: metaEventData.content_name, // Mapear content_name
              item_category: metaEventData.content_category, // Mapear content_category
              lead_score: leadScore, // Parâmetro customizado
              original_lead_id: applicationData.lead_id // Referência ao lead original (opcional)
          };

          // Enviar evento GA4 via gtag (cliente)
          // Usar o mesmo identificador do Meta para deduplicação GA4
          sendGA4Event('QualifiedLead', ga4EventParams, identifier);

          // Preparar dados para Measurement Protocol
          const ga4MpEventData = {
              // non_personalized_ads: false, // Opcional
              // user_properties: { ... } // Opcional
              events: [{
                  // Alterado de 'sign_up' para 'QualifiedLead'
                  name: 'QualifiedLead',
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

        } else {
          console.error('[SubmitApplication] window.sendMetaEvent não disponível');
        }
        
        // Limpar dados pendentes
        localStorage.removeItem('pendingSubmitApplication');
        
      } catch (error) {
        console.error('[SubmitApp Tracker] Erro ao processar evento SubmitApplication:', error);
        // Limpar em caso de erro também para evitar loops
        localStorage.removeItem('pendingSubmitApplication');
      }
    };
    
    // Executar após um pequeno atraso mais longo para garantir que a página carregou completamente
    // Aumentamos o delay para dar tempo ao GA4/GTM de inicializar completamente
    // Lead Tracker inicia em 5000ms, vamos iniciar este em 6500ms para escalonar os eventos
    const timerId = setTimeout(processSubmitApplication, 6500);
    
    return () => clearTimeout(timerId);
  }, []);

  return null;
} 