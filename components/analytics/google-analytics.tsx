"use client"

import Script from "next/script"
import { analyticsConfig } from "@/lib/analytics-config"

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.googleAnalyticsId}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[Google Analytics] Script loaded successfully")
        }}
        onError={() => {
          console.error("[Google Analytics] Failed to load script")
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsConfig.googleAnalyticsId}');
          `,
        }}
      />
    </>
  )
}

