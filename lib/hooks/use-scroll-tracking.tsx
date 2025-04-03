"use client"

import { useEffect, useRef, useState } from 'react';
import { useMetaPixel } from './use-meta-pixel';
import { generateEventId } from '@/lib/meta-conversion-api';

// Configuração dos pontos de scroll a serem rastreados
const SCROLL_THRESHOLDS = [25, 50, 75, 100];

/**
 * Hook para rastreamento de scroll com eventos para Meta Pixel e API
 * Detecta diferentes profundidades de scroll e dispara eventos correspondentes
 */
export function useScrollTracking() {
  const { trackEvent } = useMetaPixel();
  const [maxScrollPercentage, setMaxScrollPercentage] = useState(0);
  const trackedThresholds = useRef<Record<number, boolean>>({});

  useEffect(() => {
    // Se não estamos no navegador, não fazer nada
    if (typeof window === 'undefined') return;

    // Função para calcular a porcentagem de scroll
    const calculateScrollPercentage = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Evitar divisão por zero
      if (documentHeight <= windowHeight) return 100;
      
      // Calcular porcentagem de scroll
      const scrollableHeight = documentHeight - windowHeight;
      const percentage = Math.round((scrollTop / scrollableHeight) * 100);
      
      return Math.min(percentage, 100);
    };

    // Função para verificar e enviar eventos de scroll
    const handleScroll = () => {
      const currentScrollPercentage = calculateScrollPercentage();
      
      // Se o scroll atual é maior que o máximo registrado, atualizar
      if (currentScrollPercentage > maxScrollPercentage) {
        setMaxScrollPercentage(currentScrollPercentage);
        
        // Verificar quais thresholds foram alcançados
        for (const threshold of SCROLL_THRESHOLDS) {
          if (
            currentScrollPercentage >= threshold && 
            !trackedThresholds.current[threshold]
          ) {
            // Marcar este threshold como rastreado
            trackedThresholds.current[threshold] = true;
            
            // Gerar um ID de evento único para deduplicação entre pixel e API
            const eventId = generateEventId();
            
            // Enviar evento de scroll para o Meta
            trackEvent('Scroll', {
              depth_threshold: threshold,
              page_path: window.location.pathname,
              page_title: document.title,
              page_location: window.location.href,
              content_name: document.title,
              max_scroll_percentage: currentScrollPercentage,
              percent_scroll: threshold
            }, { eventID: eventId });
            
            console.log(`[Scroll Tracking] Atingido ${threshold}% com ID: ${eventId}`);
          }
        }
      }
    };
    
    // Configurar o listener de scroll com debounce para melhor performance
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 200);
    };
    
    // Adicionar listeners
    window.addEventListener('scroll', debouncedScroll);
    
    // Verificar o scroll inicial
    handleScroll();
    
    // Limpar listeners ao desmontar
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [maxScrollPercentage, trackEvent]);
  
  // Retornar o percentual máximo de scroll para possível uso no componente
  return { maxScrollPercentage };
} 