"use client"

import { GoogleAnalytics } from "./google-analytics"
import { useEventTracking } from "@/lib/event-tracking"
import { useEffect } from "react"

export function AnalyticsProvider() {
  const { initScrollTracking } = useEventTracking()

  useEffect(() => {
    // Inicializar rastreamento de scroll
    initScrollTracking()
  }, [initScrollTracking])

  return (
    <>
      {/* Facebook Pixel is loaded directly in layout.tsx using MetaPixelProvider */}
      <GoogleAnalytics />
    </>
  )
}

