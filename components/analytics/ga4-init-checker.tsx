'use client'

import { useEffect, useState } from 'react'

/**
 * Componente para verificar e garantir que o GA4 esteja inicializado
 * Para ser usado nas páginas críticas onde o rastreamento precisa funcionar
 */
export default function GA4InitChecker() {
  const [isGA4Available, setIsGA4Available] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  useEffect(() => {
    // Verificar se o GA4 está disponível
    const checkGA4 = () => {
      const hasGtag = typeof window !== 'undefined' && typeof (window as any).gtag === 'function'
      setIsGA4Available(hasGtag)
      
      if (hasGtag) {
        console.log('[GA4 Checker] GA4 está disponível e inicializado.')
        
        // Reinicializar o GA4 se necessário
        try {
          console.log('[GA4 Checker] Enviando evento de teste para verificar funcionamento.')
          ;(window as any).gtag('event', 'ga4_checker_test', {
            event_category: 'GA4 Checker',
            event_label: 'Test GA4 Availability',
            value: 1
          })
        } catch (error) {
          console.error('[GA4 Checker] Erro ao enviar evento de teste:', error)
        }
        
        return true
      }
      
      return false
    }

    // Verificar imediatamente
    const isAvailable = checkGA4()
    
    // Se não estiver disponível, tentar inicializar
    if (!isAvailable && GA4_MEASUREMENT_ID && checkCount < 5) {
      console.log(`[GA4 Checker] GA4 não está disponível. Tentativa ${checkCount + 1} de inicializar.`)
      
      // Verificar se os scripts já existem
      const existingScript = document.getElementById('ga4-gtag-script')
      const existingInit = document.getElementById('ga4-init')
      
      if (!existingScript) {
        console.log('[GA4 Checker] Script do gtag não encontrado. Criando...')
        
        // Criar script do gtag.js
        const script = document.createElement('script')
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
        script.async = true
        script.id = 'ga4-gtag-script-recovery'
        document.head.appendChild(script)
      }
      
      if (!existingInit) {
        console.log('[GA4 Checker] Script de inicialização não encontrado. Criando...')
        
        // Criar script de inicialização
        const initScript = document.createElement('script')
        initScript.id = 'ga4-init-recovery'
        initScript.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
          console.log('[GA4 Checker] GA4 inicializado via recovery script');
        `
        document.head.appendChild(initScript)
      }
      
      // Incrementar contador de tentativas
      setCheckCount(prev => prev + 1)
      
      // Verificar novamente após algum tempo
      const timeout = setTimeout(() => {
        checkGA4()
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
    
    // Se já tentou várias vezes sem sucesso
    if (checkCount >= 5 && !isAvailable) {
      console.error('[GA4 Checker] Não foi possível inicializar o GA4 após várias tentativas.')
    }
  }, [checkCount, GA4_MEASUREMENT_ID])

  // Componente não renderiza nada visualmente
  return null
} 