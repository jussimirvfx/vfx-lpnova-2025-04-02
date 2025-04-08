/**
 * Hook para rastreamento de scroll com GA4
 * Reutiliza a lógica do Meta para consistência
 */

import { useEffect, useState } from 'react';
import { useGA4Context } from '../context/ga4-provider';
import { isEventAlreadySent, markEventAsSent } from '../core/event-deduplication';
import { GA4_CONFIG } from '../config/ga4-config';

/**
 * Hook para rastreamento de scroll com GA4
 */
export function useScrollTracking() {
  const { trackEvent } = useGA4Context();
  const [maxScrollPercentage, setMaxScrollPercentage] = useState(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Função para calcular a porcentagem de scroll
    const calculateScrollPercentage = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Proteger contra divisão por zero
      if (documentHeight <= windowHeight) return 0;
      
      // Cálculo da porcentagem de scroll
      const scrollableHeight = documentHeight - windowHeight;
      const currentPercentage = Math.round((scrollTop / scrollableHeight) * 100);
      
      return Math.min(100, Math.max(0, currentPercentage));
    };
    
    // Função para lidar com eventos de scroll
    const handleScroll = () => {
      // Calcular a porcentagem atual de scroll
      const currentScrollPercentage = calculateScrollPercentage();
      
      // Verificar se o usuário scrollou mais do que o máximo anterior
      if (currentScrollPercentage <= maxScrollPercentage) return;
      
      // Atualizar o máximo de scroll
      setMaxScrollPercentage(currentScrollPercentage);
      
      // Verificar se atingimos algum threshold de scroll definido
      for (const threshold of GA4_CONFIG.SCROLL_THRESHOLDS) {
        if (currentScrollPercentage >= threshold && maxScrollPercentage < threshold) {
          // Evitar enviar o mesmo evento de scroll mais de uma vez
          const scrollIdentifier = `${window.location.pathname}_${threshold}`;
          
          if (!isEventAlreadySent('scroll', scrollIdentifier)) {
            trackEvent('scroll', {
              percent_scrolled: threshold,
              page_location: window.location.href,
              page_path: window.location.pathname,
            });
            
            // Marcar o evento como enviado
            markEventAsSent('scroll', scrollIdentifier);
            
            if (GA4_CONFIG.LOGGING.ENABLED) {
              console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] Evento de scroll de ${threshold}% enviado para ${window.location.pathname}`);
            }
          }
        }
      }
    };
    
    // Adicionar o listener de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Limpar o listener ao desmontar
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [maxScrollPercentage, trackEvent]);
} 