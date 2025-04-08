import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { META_PIXEL_CONFIG } from "@/lib/config/meta-pixel"
import { MetaPixelProvider } from "@/components/providers/meta-pixel-provider"
import { MetaPixel } from "@/components/analytics/meta-pixel"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GA4Provider } from "@/lib/ga4-tracking/context/ga4-provider"
import { GA4Tracker } from "@/components/analytics/ga4-tracker"
import { GA4_CONFIG } from "@/lib/ga4-tracking/config/ga4-config"
import GA4ViewContentTracker from "@/components/analytics/ga4-view-content-tracker"

// Definir fonte Inter como secundária
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", 
  variable: "--font-inter",
})

// Definir Plus Jakarta Sans como fonte principal
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["800", "700", "600", "500", "400"],
  preload: true,
})

export const metadata: Metadata = {
  title: "Agência VFX - Marketing Digital e Produção de Vídeos",
  description: "Marketing Digital Estratégico e Produção de Vídeos para impulsionar seu negócio",
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "VFX Agência",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preconnect para domínios importantes */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="preconnect" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload das versões mais grossas da fonte prioritariamente */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          as="style"
          fetchPriority="high"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Manifest para PWA - com tipo MIME correto */}
        <link rel="manifest" href="/manifest.json" type="application/json" />
        
        {/* Ícones para dispositivos Apple */}
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable} font-plus-jakarta`}>
        <MetaPixelProvider>
          <MetaPixel pixelId={META_PIXEL_CONFIG.PIXEL_ID} />
          <GA4Provider>
            <GA4Tracker measurementId={GA4_CONFIG.MEASUREMENT_ID} />
            <GA4ViewContentTracker />
            {children}
            <Toaster />
            <SpeedInsights />
          </GA4Provider>
        </MetaPixelProvider>
      </body>
    </html>
  )
}

