"use client";

import { useCallback, useEffect, useState } from 'react';
import { useMetaPixel } from './use-meta-pixel';
import { useGA4 } from './use-ga4';

/**
 * Hook para rastreamento de eventos em múltiplas plataformas simultaneamente
 * Facilita o envio de eventos para Meta Pixel e GA4 de forma consistente
 */
export function useEventTracking() {
  const [hasScrollTracking, setHasScrollTracking] = useState(false);
  const meta = useMetaPixel();
  const ga4 = useGA4();

  /**
   * Inicia o rastreamento de profundidade de scroll para ambas plataformas
   */
  const initScrollTracking = useCallback(() => {
    if (typeof window === 'undefined' || hasScrollTracking) return;

    // Marcadores de profundidade (porcentagem da página)
    const scrollDepths = [25, 50, 75, 90];
    let trackedDepths: number[] = [];

    // Função para verificar e rastrear a profundidade de scroll
    const checkScrollDepth = () => {
      // Altura total da página que pode ser scrollada
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ) - window.innerHeight;

      // Posição atual do scroll
      const scrollPosition = window.scrollY;

      // Calcular a porcentagem de scroll
      const scrollPercentage = Math.round((scrollPosition / pageHeight) * 100);

      // Verificar cada profundidade não rastreada ainda
      scrollDepths.forEach(depth => {
        if (!trackedDepths.includes(depth) && scrollPercentage >= depth) {
          // Enviar evento para Meta Pixel
          if (meta.isInitialized) {
            meta.trackEvent('ScrollDepth', {
              depth_percentage: depth,
              page_path: window.location.pathname
            });
          }

          // Enviar evento para GA4
          if (ga4.isInitialized) {
            ga4.trackEvent('scroll', {
              percent_scrolled: depth,
              page_path: window.location.pathname,
              page_title: document.title
            });
          }

          // Adicionar à lista de profundidades já rastreadas
          trackedDepths.push(depth);
        }
      });
    };

    // Adicionar listener de scroll
    window.addEventListener('scroll', checkScrollDepth, { passive: true });
    setHasScrollTracking(true);

    // Limpar ao desmontar
    return () => {
      window.removeEventListener('scroll', checkScrollDepth);
      setHasScrollTracking(false);
    };
  }, [hasScrollTracking, meta, ga4]);

  /**
   * Rastreia um evento de visualização de conteúdo
   */
  const trackViewContent = useCallback((params: {
    content_type?: string;
    content_name?: string;
    content_ids?: string[];
    content_category?: string;
    value?: number;
    currency?: string;
  }) => {
    // Enviar para Meta Pixel
    if (meta.isInitialized) {
      meta.trackEvent('ViewContent', params);
    }

    // Enviar para GA4
    if (ga4.isInitialized) {
      ga4.trackEvent('view_item', {
        items: [{
          item_id: params.content_ids?.[0] || '',
          item_name: params.content_name || '',
          item_category: params.content_category || '',
          price: params.value || 0,
          currency: params.currency || 'BRL'
        }],
        currency: params.currency || 'BRL',
        value: params.value || 0
      });
    }
  }, [meta, ga4]);

  /**
   * Rastreia um evento de contato
   */
  const trackContact = useCallback((params: {
    content_category?: string;
    content_name?: string;
    method?: string;
  }) => {
    // Enviar para Meta Pixel
    if (meta.isInitialized) {
      meta.trackEvent('Contact', {
        content_category: params.content_category,
        content_name: params.content_name,
        method: params.method
      });
    }

    // Enviar para GA4
    if (ga4.isInitialized) {
      ga4.trackEvent('contact', {
        contact_type: params.method || 'other',
        content_category: params.content_category || '',
        content_name: params.content_name || ''
      });
    }
  }, [meta, ga4]);

  /**
   * Rastreia um evento de lead (conversão principal)
   */
  const trackLead = useCallback((params: {
    content_category?: string;
    content_name?: string;
    value?: number;
    currency?: string;
    form_id?: string;
    lead_id?: string;
    lead_type?: string;
  }) => {
    // Enviar para Meta Pixel
    if (meta.isInitialized) {
      meta.trackEvent('Lead', {
        content_category: params.content_category,
        content_name: params.content_name,
        value: params.value,
        currency: params.currency,
        form_id: params.form_id
      });
    }

    // Enviar para GA4
    if (ga4.isInitialized) {
      ga4.trackEvent('generate_lead', {
        currency: params.currency || 'BRL',
        value: params.value || 0,
        lead_id: params.lead_id || '',
        lead_type: params.lead_type || 'form',
        form_id: params.form_id || '',
        content_name: params.content_name || '',
        content_category: params.content_category || ''
      }, {
        // Envie para o Measurement Protocol
        sendToServerAPI: true
      });
      
      // Se for configurado, também enviar para Google Ads como conversão
      if (typeof window !== 'undefined' && window.google_conversion_id && window.google_conversion_label) {
        ga4.trackConversion(
          window.google_conversion_id,
          window.google_conversion_label,
          { value: params.value, currency: params.currency || 'BRL' }
        );
      }
    }
  }, [meta, ga4]);

  return {
    meta,
    ga4,
    initScrollTracking,
    trackViewContent,
    trackContact,
    trackLead
  };
}

// Adicionar tipagem para Google Ads
declare global {
  interface Window {
    google_conversion_id?: string;
    google_conversion_label?: string;
  }
} 