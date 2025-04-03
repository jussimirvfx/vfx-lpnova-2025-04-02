"use client"

import { useEffect } from "react"
import { useMetaPixel } from "@/lib/hooks/use-meta-pixel"
import { useScrollTracking } from "@/lib/hooks/use-scroll-tracking"
import ViewContentTracker from "./view-content-tracker"
import Script from 'next/script'
import { META_PIXEL_CONFIG } from '@/lib/config/meta-pixel'

interface MetaPixelProps {
  pixelId: string
}

/**
 * Componente Meta Pixel
 * Responsável por renderizar o script base do FB e disparar o PageView inicial.
 * A inicialização é gerenciada pelo MetaPixelProvider.
 * 
 * IMPORTANTE:
 * 1. Este componente NÃO faz a inicialização (fbq('init')) - isso é responsabilidade do useMetaPixel
 * 2. Apenas carrega o script base do Facebook e configura o fallback noscript
 * 3. O PageView inicial é disparado após a inicialização completa
 * 4. Para prevenir conflitos com múltiplas versões, carregamos o script inline (sem preload)
 * 5. Usamos strategy="beforeInteractive" para melhorar a performance
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  const { isInitialized, trackPageView } = useMetaPixel()

  // Disparar PageView inicial quando o pixel estiver inicializado
  useEffect(() => {
    if (isInitialized) {
      trackPageView()
    }
  }, [isInitialized, trackPageView])

  // Ativar rastreamento de scroll (pode ser movido para cá se preferir)
  useScrollTracking();

  return (
    <>
      {/* Componente para rastrear eventos ViewContent em páginas específicas */}
      <ViewContentTracker />

      {/* 
        Script principal do Meta Pixel
        - Importante: Usamos strategy="beforeInteractive" para carregar o script o mais cedo possível
        - Removemos o preload para evitar problemas de CORS
        - Adicionamos verificações para evitar carregamentos duplicados
      */}
      <Script
        id="meta-pixel-base-script"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log(`[${META_PIXEL_CONFIG.LOGGING.PREFIX}] Script do Facebook carregado com sucesso`)
        }}
        onError={(e) => {
          console.error(`[${META_PIXEL_CONFIG.LOGGING.PREFIX}] Erro ao carregar script do Facebook:`, e)
        }}
      >
        {`
          // Verificação para evitar carregamento duplicado
          if (typeof window !== 'undefined' && !window._fbPixelScriptLoaded) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            // Marcar como carregado para evitar duplicações
            window._fbPixelScriptLoaded = true;
            
            // Log para Debug
            console.log('[Meta Pixel] Base script loaded successfully');
          }
        `}
      </Script>

      {/* Fallback para navegadores sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
          fetchPriority="low"
        />
      </noscript>
    </>
  )
}