"use client"

import { useEffect } from 'react'
import { useMetaPixel } from '@/lib/hooks/use-meta-pixel'

interface ViewContentTrackerProps {
  contentName?: string
  contentCategory?: string
  contentIds?: string[]
  value?: number
  currency?: string
}

export default function ViewContentTracker({
  contentName,
  contentCategory,
  contentIds,
  value,
  currency = 'BRL'
}: ViewContentTrackerProps) {
  const { trackEvent, isInitialized } = useMetaPixel()

  useEffect(() => {
    if (!isInitialized) return

    // Delay para garantir que a página carregou completamente
    const timer = setTimeout(() => {
      trackEvent('ViewContent', {
        content_name: contentName || (typeof document !== 'undefined' ? document.title : ''),
        content_category: contentCategory,
        content_ids: contentIds,
        value,
        currency
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [trackEvent, isInitialized, contentName, contentCategory, contentIds, value, currency])

  return null
} 