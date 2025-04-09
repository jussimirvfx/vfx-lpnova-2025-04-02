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
    // Log inicial
    console.log(`[GA4 Checker] Iniciando verificação. GA4_MEASUREMENT_ID definido: ${!!GA4_MEASUREMENT_ID}`);
    
    if (!GA4_MEASUREMENT_ID) {
      console.error('[GA4 Checker] ID de medição do GA4 não está definido nas variáveis de ambiente!');
      return;
    }

    // Verificar se estamos em uma página de conversão crítica
    const isConversionPage = typeof window !== 'undefined' && 
      (window.location.pathname.includes('/obrigado') || 
       window.location.pathname.includes('/apresentacao'));
    
    const debugPrefix = isConversionPage ? '[CONVERSÃO] ' : '';

    // Verificar se o GA4 está disponível
    const checkGA4 = () => {
      console.log(`${debugPrefix}[GA4 Checker] Tentativa ${checkCount + 1}: Verificando disponibilidade do GA4...`);
      
      // Verificar window
      if (typeof window === 'undefined') {
        console.log(`${debugPrefix}[GA4 Checker] window não está definido (provavelmente em SSR)`);
        return false;
      }
      
      // Verificar gtag
      const hasGtag = typeof (window as any).gtag === 'function';
      console.log(`${debugPrefix}[GA4 Checker] gtag disponível: ${hasGtag}`);
      
      // Verificar dataLayer
      const hasDataLayer = Array.isArray((window as any).dataLayer);
      console.log(`${debugPrefix}[GA4 Checker] dataLayer disponível: ${hasDataLayer}`);
      
      // Verificar scripts
      const scripts = document.querySelectorAll('script');
      const gtagScripts = Array.from(scripts).filter(script => 
        script.src && script.src.includes('googletagmanager.com/gtag')
      );
      console.log(`${debugPrefix}[GA4 Checker] Scripts do gtag encontrados: ${gtagScripts.length}`);
      
      if (gtagScripts.length > 0) {
        gtagScripts.forEach((script, index) => {
          console.log(`${debugPrefix}[GA4 Checker] Script gtag ${index + 1}: ${script.src}, id: ${script.id || 'não definido'}`);
        });
      }
      
      setIsGA4Available(hasGtag);
      
      if (hasGtag) {
        console.log(`${debugPrefix}[GA4 Checker] GA4 está disponível e inicializado.`);
        
        // Reinicializar o GA4 se necessário
        try {
          console.log(`${debugPrefix}[GA4 Checker] Enviando evento de teste para verificar funcionamento.`);
          (window as any).gtag('event', 'ga4_checker_test', {
            event_category: 'GA4 Checker',
            event_label: 'Test GA4 Availability',
            value: 1,
            debug_mode: true,
            transport_type: 'beacon',
            non_interaction: true,
            send_to: GA4_MEASUREMENT_ID
          });
          console.log(`${debugPrefix}[GA4 Checker] Evento de teste enviado com sucesso.`);
        } catch (error) {
          console.error(`${debugPrefix}[GA4 Checker] Erro ao enviar evento de teste:`, error);
        }
        
        return true;
      }
      
      return false;
    };

    // Verificar imediatamente
    const isAvailable = checkGA4();
    
    // Se não estiver disponível ou se estamos em uma página de conversão crítica, sempre tentar inicializar
    if ((!isAvailable || isConversionPage) && GA4_MEASUREMENT_ID && checkCount < 5) {
      console.log(`${debugPrefix}[GA4 Checker] GA4 ${isConversionPage ? 'reforçando inicialização em página de conversão' : 'não está disponível'}. Tentativa ${checkCount + 1}.`);
      
      // Verificar se os scripts já existem
      const existingScript = document.getElementById('ga4-gtag-script') 
        || document.getElementById('ga4-gtag-script-recovery');
      const existingInit = document.getElementById('ga4-init') 
        || document.getElementById('ga4-init-recovery');
      
      if (!existingScript) {
        console.log(`${debugPrefix}[GA4 Checker] Script do gtag não encontrado. Criando...`);
        
        // Criar script do gtag.js
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
        script.async = true;
        script.id = 'ga4-gtag-script-recovery';
        
        // Adicionar eventos para depuração
        script.onload = () => console.log(`${debugPrefix}[GA4 Checker] Script do gtag carregado com sucesso.`);
        script.onerror = (e) => console.error(`${debugPrefix}[GA4 Checker] Erro ao carregar script do gtag:`, e);
        
        document.head.appendChild(script);
        console.log(`${debugPrefix}[GA4 Checker] Script do gtag adicionado ao head.`);
      } else {
        console.log(`${debugPrefix}[GA4 Checker] Script do gtag já existe com id: ${existingScript.id}`);
      }
      
      if (!existingInit) {
        console.log(`${debugPrefix}[GA4 Checker] Script de inicialização não encontrado. Criando...`);
        
        // Criar script de inicialização
        const initScript = document.createElement('script');
        initScript.id = 'ga4-init-recovery';
        initScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            transport_type: 'beacon',
            send_page_view: true,
            gtag_enable_tcf_support: true
          });
          console.log('[GA4 Checker] GA4 inicializado via recovery script');
        `;
        
        document.head.appendChild(initScript);
        console.log(`${debugPrefix}[GA4 Checker] Script de inicialização adicionado ao head.`);
      } else {
        console.log(`${debugPrefix}[GA4 Checker] Script de inicialização já existe com id: ${existingInit.id}`);
      }
      
      // Incrementar contador de tentativas
      setCheckCount(prev => prev + 1);
      
      // Verificar novamente após algum tempo
      const timeout = setTimeout(() => {
        checkGA4();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    
    // Se já tentou várias vezes sem sucesso
    if (checkCount >= 5 && !isAvailable) {
      console.error(`${debugPrefix}[GA4 Checker] Não foi possível inicializar o GA4 após várias tentativas.`);
      
      // Última tentativa - verificação de erros adicionais
      console.log(`${debugPrefix}[GA4 Checker] Verificando possíveis problemas...`);
      
      if (typeof window === 'undefined') {
        console.error(`${debugPrefix}[GA4 Checker] window não está definido!`);
      } else {
        // Verificar se há bloqueadores de anúncios
        try {
          const test = document.createElement('div');
          test.className = 'adsbox';
          test.innerHTML = '&nbsp;';
          document.body.appendChild(test);
          
          setTimeout(() => {
            if (test.offsetHeight === 0) {
              console.error(`${debugPrefix}[GA4 Checker] Possível bloqueador de anúncios detectado!`);
            }
            document.body.removeChild(test);
          }, 100);
        } catch (e) {
          console.error(`${debugPrefix}[GA4 Checker] Erro ao verificar bloqueador de anúncios:`, e);
        }
        
        // Verificar erros de CSP (Content Security Policy)
        if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
          console.log(`${debugPrefix}[GA4 Checker] Verificando extensões de navegador que podem estar bloqueando o script...`);
        }
      }
    }
  }, [checkCount, GA4_MEASUREMENT_ID]);

  // Componente não renderiza nada visualmente
  return null;
} 