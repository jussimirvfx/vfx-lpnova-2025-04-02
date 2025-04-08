import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { META_PIXEL_CONFIG } from "@/lib/config/meta-pixel"
import { MetaPixelProvider } from "@/components/providers/meta-pixel-provider"
import { MetaPixel } from "@/components/analytics/meta-pixel"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from 'next/script'
import ScrollTracker from "@/components/analytics/scroll-tracker"
import VideoTracker from "@/components/analytics/video-tracker"
import GA4RouteTracker from "@/components/analytics/ga4-route-tracker"

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

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

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

        {/* Google Analytics 4 - Global Site Tag (gtag.js) */}
        {GA4_MEASUREMENT_ID && (
          <>
            <Script
              id="ga4-gtag-script"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
              onLoad={() => {
                console.log('[GA4] Script gtag.js carregado com sucesso');
              }}
              onError={(e) => {
                console.error('[GA4] Erro ao carregar script gtag.js:', e);
              }}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());

                  gtag('config', '${GA4_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true, // Permitir o page_view inicial, para página de entrada
                    cookie_flags: 'SameSite=None;Secure',
                    cookie_domain: window.location.hostname,
                    cookie_expires: 63072000 // 2 anos em segundos
                  });
                  
                  console.log('[GA4] Inicializado com ID: ${GA4_MEASUREMENT_ID}');
                  
                  // Configurar o Next.js para rastrear mudanças de rota e enviar page_view
                  if (typeof window !== 'undefined') {
                    window.previousPath = window.location.pathname;
                    
                    // Esta função será chamada pelo Next Router no client-side
                    window.trackRouteChange = function(url) {
                      const newPath = new URL(url, window.location.origin).pathname;
                      
                      // Evitar disparos duplicados na mesma página
                      if (window.previousPath === newPath) return;
                      
                      // Atualizar o path no config e enviar o page_view
                      console.log('[GA4] Mudança de rota detectada:', newPath);
                      gtag('config', '${GA4_MEASUREMENT_ID}', {
                        page_path: newPath,
                        page_title: document.title
                      });
                      
                      // Atualizar o path anterior
                      window.previousPath = newPath;
                    };
                  }
                `,
              }}
              onLoad={() => {
                console.log('[GA4] Configuração inicializada');
              }}
              onError={(e) => {
                console.error('[GA4] Erro ao inicializar configuração:', e);
              }}
            />
          </>
        )}
        {/* Fim do Google Analytics 4 */}
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable} font-plus-jakarta`}>
        <MetaPixelProvider>
          <MetaPixel pixelId={META_PIXEL_CONFIG.PIXEL_ID} />
          <GA4RouteTracker />
          <ScrollTracker />
          <VideoTracker />
          {children}
          <Toaster />
          <SpeedInsights />
        </MetaPixelProvider>
      </body>
    </html>
  )
}

