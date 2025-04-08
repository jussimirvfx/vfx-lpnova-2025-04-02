"use client";

import { useEffect, useState } from 'react';
import { useMetaGA4Gateway } from '@/lib/ga4-tracking/meta-gateway';
import { logger, LogCategory } from '@/lib/ga4-tracking/core/logger';

/**
 * Componente que instala o gateway para sincronizar eventos do Meta Pixel com o GA4
 * Este componente deve ser incluído no layout principal da aplicação
 * após o MetaPixelInitializer e o GA4Initializer
 * @returns {null} Não renderiza nada visível
 */
export function MetaGA4Gateway() {
  const { metaPixel, installGateway, ga4, isInstalled } = useMetaGA4Gateway();
  const [gatewayStatus, setGatewayStatus] = useState({ installed: false });
  
  // Inicializar o gateway quando ambos estiverem prontos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Verificar inicialização a cada 500ms até ambos estarem prontos ou após 10 tentativas
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkAndInstall = () => {
      // Verificar se Meta Pixel e GA4 estão inicializados
      const metaReady = metaPixel.isInitialized;
      const ga4Ready = ga4.isInitialized;
      
      logger.debug(LogCategory.INIT, `Verificando inicialização (${attempts+1}/${maxAttempts})`, {
        metaPixelReady: metaReady,
        ga4Ready: ga4Ready
      });
      
      if (metaReady || ga4Ready) {
        // Pelo menos um está inicializado, tentamos instalar
        logger.info(LogCategory.INIT, 'Meta Pixel ou GA4 inicializado, instalando gateway', {
          metaPixelReady: metaReady,
          ga4Ready: ga4Ready
        });
        
        const status = installGateway();
        setGatewayStatus(status);
        
        if (status.installed) {
          logger.info(LogCategory.INIT, 'Gateway instalado com sucesso', {
            method: status.method,
            fbqIntercepted: status.fbqIntercepted
          });
          
          // Exibir mensagem no console
          console.info(`[Meta → GA4] Gateway instalado: eventos do Meta Pixel serão enviados também para o GA4 (método: ${status.method})`);
        }
      } else if (attempts < maxAttempts) {
        // Tentar novamente após 500ms
        attempts++;
        setTimeout(checkAndInstall, 500);
      } else {
        logger.warn(LogCategory.INIT, `Não foi possível instalar o gateway após ${maxAttempts} tentativas`);
      }
    };
    
    // Iniciar o processo de verificação
    checkAndInstall();
    
    // Limpeza no desmonte do componente
    return () => {
      attempts = maxAttempts; // Para interromper o loop
    };
  }, [metaPixel, ga4, installGateway]);
  
  // Não renderiza nada visível
  return null;
} 