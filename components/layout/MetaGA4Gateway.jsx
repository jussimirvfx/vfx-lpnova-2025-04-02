"use client";

import { useEffect } from 'react';
import { useMetaGA4Gateway } from '@/lib/ga4-tracking/meta-gateway';
import { logger, LogCategory } from '@/lib/ga4-tracking/core/logger';

/**
 * Componente que instala o gateway para sincronizar eventos do Meta Pixel com o GA4
 * Este componente deve ser incluído no layout principal da aplicação
 * após o MetaPixelInitializer e o GA4Initializer
 * @returns {null} Não renderiza nada visível
 */
export function MetaGA4Gateway() {
  const { metaPixel, installGateway, ga4 } = useMetaGA4Gateway();
  
  // Inicializar o gateway quando ambos estiverem prontos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Verificar se Meta Pixel e GA4 estão inicializados
    if (!metaPixel.isInitialized || !ga4.isInitialized) {
      logger.debug(LogCategory.INIT, 'Aguardando inicialização para instalar gateway', {
        metaPixelReady: metaPixel.isInitialized,
        ga4Ready: ga4.isInitialized
      });
      return;
    }
    
    // Instalar o gateway
    logger.info(LogCategory.INIT, 'Meta Pixel e GA4 inicializados, instalando gateway');
    installGateway();
    
    // Exibir mensagem no console
    console.info('[Meta → GA4] Gateway instalado: eventos do Meta Pixel serão enviados também para o GA4');
  }, [metaPixel.isInitialized, ga4.isInitialized, installGateway]);
  
  // Não renderiza nada visível
  return null;
} 