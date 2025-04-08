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
  const { metaPixel, installGateway, ga4 } = useMetaGA4Gateway();
  const [gatewayStatus, setGatewayStatus] = useState({
    installed: false,
    attempted: false,
    error: null
  });
  
  // Inicializar o gateway quando ambos estiverem prontos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Verificar se Meta Pixel e GA4 estão inicializados
    const metaReady = metaPixel.isInitialized;
    const ga4Ready = ga4.isInitialized;
    
    logger.debug(LogCategory.INIT, 'Verificando status para instalar gateway', {
      metaPixelReady: metaReady,
      ga4Ready: ga4Ready,
      attempted: gatewayStatus.attempted
    });
    
    // Só instalar se ambos estiverem prontos e não foi tentado antes
    if (metaReady && ga4Ready && !gatewayStatus.attempted) {
      try {
        logger.info(LogCategory.INIT, 'Meta Pixel e GA4 inicializados, instalando gateway');
        
        // Instalar o gateway
        const result = installGateway();
        
        setGatewayStatus({
          installed: result.installed,
          attempted: true,
          error: null,
          viaMonkeyPatch: result.viaMonkeyPatch
        });
        
        // Exibir mensagem no console baseada no resultado
        if (result.installed) {
          console.info('[Meta → GA4] Gateway instalado com sucesso! Eventos do Meta Pixel serão enviados também para o GA4.');
          
          if (result.viaMonkeyPatch) {
            console.info('[Meta → GA4] Utilizando interceptação direta de chamadas fbq (monkey patch).');
          } else {
            console.info('[Meta → GA4] Utilizando hook para interceptar eventos.');
          }
        } else {
          console.warn('[Meta → GA4] Falha ao instalar gateway. Eventos do Meta Pixel não serão enviados para o GA4.');
        }
      } catch (error) {
        logger.error(LogCategory.INIT, 'Erro ao instalar Gateway Meta -> GA4', {
          error: error instanceof Error ? error.message : String(error)
        });
        
        setGatewayStatus({
          installed: false,
          attempted: true,
          error: error instanceof Error ? error.message : String(error)
        });
        
        console.error('[Meta → GA4] Erro ao instalar gateway:', error);
      }
    }
  }, [
    metaPixel.isInitialized, 
    ga4.isInitialized, 
    installGateway, 
    gatewayStatus.attempted
  ]);
  
  // Verificação adicional após 5 segundos se o gateway não foi instalado
  useEffect(() => {
    if (typeof window === 'undefined' || gatewayStatus.installed) return;
    
    // Se já tentamos instalar e falhou, tentar novamente após 5 segundos
    // Isso ajuda casos onde a inicialização do fbq ocorre mais tarde
    const timeoutId = setTimeout(() => {
      if (gatewayStatus.attempted && !gatewayStatus.installed) {
        logger.info(LogCategory.INIT, 'Tentando instalar gateway novamente após timeout');
        
        try {
          const result = installGateway();
          
          setGatewayStatus(prev => ({
            ...prev,
            installed: result.installed,
            viaMonkeyPatch: result.viaMonkeyPatch,
            retried: true
          }));
          
          if (result.installed) {
            console.info('[Meta → GA4] Gateway instalado com sucesso na segunda tentativa!');
          }
        } catch (error) {
          logger.error(LogCategory.INIT, 'Erro ao reinstalar Gateway Meta -> GA4', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [gatewayStatus, installGateway]);
  
  // Não renderiza nada visível
  return null;
} 