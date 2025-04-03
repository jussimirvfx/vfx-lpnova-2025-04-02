'use client'

import { useEffect } from 'react'
import { useMetaPixel } from '@/lib/hooks/use-meta-pixel'
import { getMetaParams, prepareUserData } from '@/lib/meta-utils'
import { generateEventId } from '@/lib/meta-conversion-api'

// Estender a interface Window para incluir nossa função sendMetaEvent
declare global {
  interface Window {
    sendMetaEvent?: (
      eventName: string, 
      params?: Record<string, any>, 
      options?: { eventID?: string; user_data?: Record<string, any> }
    ) => void;
  }
}

// Interface para dados do usuário
interface UserDataInfo {
  email?: string;
  phone?: string;
  name?: string;
  fbc?: string;
  fbp?: string;
}

export default function ClientPageView() {
  const { trackEvent } = useMetaPixel()

  useEffect(() => {
    // Definir a função sendMetaEvent no objeto window
    if (typeof window !== 'undefined' && !window.sendMetaEvent) {
      window.sendMetaEvent = (eventName, params, options) => {
        console.log(`[Meta Event] Enviando evento ${eventName} via window.sendMetaEvent`, {
          params,
          options
        });
        return trackEvent(eventName, params, options);
      };
      console.log('[Meta Event] Função window.sendMetaEvent definida com sucesso');
    }

    // Rastrear PageView com delay para garantir que a página carregou completamente
    const timer = setTimeout(() => {
      // Obter parâmetros do Meta (fbc e fbp)
      const metaParams = getMetaParams();
      
      // Verificar se há dados pendentes no localStorage para enriquecer o user_data
      let userDataInfo: UserDataInfo = {};
      try {
        const pendingData = localStorage.getItem('pendingLeadEvent');
        if (pendingData) {
          const leadData = JSON.parse(pendingData);
          userDataInfo = {
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name
          };
          console.log('[PageView] Dados do usuário encontrados para enriquecer PageView', {
            hasEmail: !!leadData.email,
            hasPhone: !!leadData.phone,
            hasName: !!leadData.name
          });
        }
      } catch (e) {
        console.warn('[PageView] Erro ao ler dados pendentes:', e);
      }
      
      // Preparar dados do usuário formatados corretamente
      const userData = prepareUserData({
        ...userDataInfo,
        fbc: metaParams.fbc,
        fbp: metaParams.fbp
      });
      
      // Gerar ID único para o evento
      const eventId = generateEventId();
      
      // Parâmetros principais do evento (sem user_data aninhado)
      const eventParams = {
        page_title: 'Página de Obrigado - VFX Agência',
        page_location: window.location.href,
        page_path: '/obrigado'
      };
      
      console.log('[PageView] Enviando PageView com user_data completo', {
        hasUserData: true,
        userData: {
          hasEmail: !!userDataInfo.email,
          hasPhone: !!userDataInfo.phone,
          hasName: !!userDataInfo.name,
          hasFbc: !!metaParams.fbc,
          hasFbp: !!metaParams.fbp
        }
      });
      
      // Enviar evento com user_data nas options
      trackEvent('PageView', eventParams, {
        eventID: eventId,
        user_data: userData
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [trackEvent]);

  return null;
} 