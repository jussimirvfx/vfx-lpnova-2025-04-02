"use client"

import Script from "next/script"
import { analyticsConfig } from "@/lib/analytics-config"

export function GoogleAds() {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.googleAdsId}`}
      />
      <Script
        id="google-ads"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsConfig.googleAdsId}');
          `,
        }}
      />
    </>
  )
}

