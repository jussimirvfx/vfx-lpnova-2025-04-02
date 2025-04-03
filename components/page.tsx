import type { Metadata } from "next"
import { HeroTitle } from "@/components/hero-title"
import dynamic from "next/dynamic"

// Importação dinâmica da aplicação principal para priorizar o título LCP
const ClientApp = dynamic(() => import("@/components/client-app").then((mod) => mod.ClientApp), {
  ssr: true,
  loading: () => <MobileFirstLoadingState />,
})

// Componente de carregamento estático que prioriza o título
function MobileFirstLoadingState() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-8 sm:pt-32">
        <div className="max-w-3xl">
          {/* Renderização estática do título LCP */}
          <HeroTitle />

          {/* Placeholders para o resto do conteúdo */}
          <div className="h-6 mt-6 bg-gray-100 rounded w-full max-w-md"></div>
          <div className="h-6 mt-3 bg-gray-100 rounded w-5/6 max-w-md"></div>
          <div className="h-6 mt-3 bg-gray-100 rounded w-4/6 max-w-md"></div>

          <div className="h-12 mt-8 bg-blue-100 rounded w-full max-w-md"></div>
          <div className="h-12 mt-4 bg-gray-100 rounded w-full max-w-md"></div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: "Agência VFX - Marketing Digital e Produção de Vídeos",
  description:
    "Assessoria Comercial com Marketing Digital e Produção de Vídeos. Mais de 3500 empresas confiam no método VFX.",
  manifest: "/manifest.json",
  themeColor: "#187eff",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  verification: {
    google: "google-site-verification=xyz",
  },
  openGraph: {
    title: "Agência VFX - Marketing Digital e Produção de Vídeos",
    description: "Assessoria Comercial com Marketing Digital e Produção de Vídeos",
    type: "website",
    url: "https://vfx.com.br",
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
    <>
      {/* Título LCP pré-renderizado instantaneamente */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "16px",
          width: "calc(100% - 32px)",
          maxWidth: "600px",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.01, // praticamente invisível, mas suficiente para ser renderizado
        }}
      >
        <h1
          id="static-hero-title"
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            lineHeight: 1.2,
            marginBottom: "1.5rem",
            fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          }}
        >
          <span style={{ fontWeight: 800 }}>Comunique</span> Melhor,{" "}
          <span style={{ color: "#2563eb", fontWeight: 800 }}>Anuncie Para as Pessoas Certas</span> e{" "}
          <span style={{ fontWeight: 800 }}>VENDA MAIS!</span>
        </h1>
      </div>

      {/* Aplicação principal */}
      <ClientApp />
    </>
  )
}

