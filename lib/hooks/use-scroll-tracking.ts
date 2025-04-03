"use client"

import { useEffect, useCallback } from 'react'
import { useMetaPixel } from './use-meta-pixel'
import { META_PIXEL_CONFIG } from '@/lib/config/meta-pixel'

// Armazenar os thresholds já atingidos para evitar disparos repetidos
const reachedThresholds = new Set<number>()
const SCROLL_THRESHOLDS = [25, 50, 75, 100]

export function useScrollTracking() {
  const { trackEvent, isInitialized } = useMetaPixel()

  const handleScroll = useCallback(() => {
    // Verificar se o Meta Pixel está inicializado
    if (!isInitialized || typeof window === 'undefined') return

    const windowHeight = window.innerHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const documentHeight = document.documentElement.scrollHeight

    // Se a página não tiver scroll, considerar como 100%
    if (documentHeight <= windowHeight) return 100

    // Calcular a porcentagem de scroll
    const scrollableHeight = documentHeight - windowHeight
    const scrollPercent = Math.round((scrollTop / scrollableHeight) * 100)

    // Registrar métricas de debug
    console.log('[Event Tracking] Scroll tracked:', {
      depth: `${scrollPercent}%`,
      position: `${Math.round(scrollTop)}px`,
      pageHeight: `${documentHeight}px`
    })

    // Verificar cada threshold
    SCROLL_THRESHOLDS.forEach(threshold => {
      // Só rastrear se o threshold foi atingido E ainda não foi registrado
      if (scrollPercent >= threshold && !reachedThresholds.has(threshold)) {
        // Marcar como atingido para evitar disparos repetidos
        reachedThresholds.add(threshold)
        
        // Gerar um ID único para o evento
        const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 11)}`
        
        // Registrar o evento
        trackEvent('Scroll', {
          percent_scroll: threshold,
          page_path: window.location.pathname,
          page_title: typeof document !== 'undefined' ? document.title : '',
          content_name: typeof document !== 'undefined' ? document.title : ''
        })
        
        // Log para debug
        console.log(`[Scroll Tracking] Atingido ${threshold}% com ID: ${eventId}`)
      }
    })
  }, [trackEvent, isInitialized]) // Adicionar isInitialized como dependência

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return

    // Log para debug da inicialização
    console.log('[Event Tracking] Scroll tracking initialized')
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll, isInitialized])
} 