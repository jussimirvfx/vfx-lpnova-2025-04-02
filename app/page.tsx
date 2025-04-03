import type { Metadata, Viewport } from "next"
import dynamic from "next/dynamic"
import { HeroSkeleton } from "@/components/hero-skeleton"

// Importação dinâmica do restante da aplicação para priorizar o LCP
const ClientApp = dynamic(() => import("@/components/client-app").then((mod) => mod.ClientApp), {
  ssr: true,
  loading: () => <HeroSkeleton />,
})

// Carrega o componente de logs de forma dinâmica apenas no lado do cliente
const MetaPixelLogs = dynamic(() => import('@/components/debug/meta-pixel-logs'), {
  ssr: false
})

export const viewport: Viewport = {
  themeColor: "#187eff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: "Agência VFX - Marketing Digital e Produção de Vídeos",
  description:
    "Assessoria Comercial com Marketing Digital e Produção de Vídeos. Mais de 3500 empresas confiam no método VFX.",
  manifest: "/manifest.json",
  verification: {
    google: "google-site-verification=xyz", // Adicionar código real
  },
  openGraph: {
    title: "Agência VFX - Marketing Digital e Produção de Vídeos",
    description: "Assessoria Comercial com Marketing Digital e Produção de Vídeos",
    type: "website",
    url: "https://vfx.com.br", // Adicionar URL real
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Agência VFX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agência VFX - Marketing Digital e Produção de Vídeos",
    description: "Assessoria Comercial com Marketing Digital e Produção de Vídeos",
    images: ["/images/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Page() {
  return (
    <main>
      <ClientApp />
      <MetaPixelLogs />
    </main>
  )
}

