"use client"
import { AnalyticsProvider } from "@/components/analytics/analytics-provider"
import dynamic from "next/dynamic"
import { Footer } from "@/components/footer"
import { IntegratedServices } from "@/components/integrated-services"
import { TrustedCompanies } from "@/components/trusted-companies"

// Componentes críticos carregados imediatamente
const DynamicHeader = dynamic(() => import("@/components/header").then((mod) => mod.Header), { ssr: true })
const DynamicHero = dynamic(() => import("@/components/hero").then((mod) => mod.Hero), { ssr: true })

// Componentes abaixo da dobra com loading lazy
const DynamicBottomWhatsAppForm = dynamic(() => import("@/components/bottom-whatsapp-form").then((mod) => mod.BottomWhatsAppForm), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-50" aria-hidden="true"></div>,
})
const DynamicContactModal = dynamic(() => import("@/components/contact-modal").then((mod) => mod.ContactModal), {
  ssr: false,
})
const DynamicWhyChooseUs = dynamic(() => import("@/components/why-choose-us").then((mod) => mod.WhyChooseUs), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-50" aria-hidden="true"></div>,
})
const DynamicStatsSection = dynamic(() => import("@/components/stats-section"), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-gray-50" aria-hidden="true"></div>,
})

// Adicione loading states para os outros componentes
const Features = dynamic(() => import("@/components/features").then((mod) => mod.Features), {
  loading: () => <div className="h-[400px] bg-gray-50" aria-hidden="true"></div>,
})
const Team = dynamic(() => import("@/components/team").then((mod) => mod.Team), {
  loading: () => <div className="h-[400px] bg-gray-50" aria-hidden="true"></div>,
})
const SalesFunnel = dynamic(() => import("@/components/sales-funnel").then((mod) => mod.SalesFunnel), {
  loading: () => <div className="h-[400px] bg-gray-50" aria-hidden="true"></div>,
})
const SuccessCases = dynamic(() => import("@/components/success-cases").then((mod) => mod.SuccessCases), {
  loading: () => <div className="h-[400px] bg-gray-50" aria-hidden="true"></div>,
})
const Testimonials = dynamic(() => import("@/components/testimonials").then((mod) => mod.Testimonials), {
  loading: () => <div className="h-[400px] bg-gray-50" aria-hidden="true"></div>,
})

export function ClientApp() {
  return (
    <>
      <DynamicHeader />
      <main>
        <DynamicHero />
        <IntegratedServices />
        <TrustedCompanies />
        <DynamicStatsSection />
        <Features />
        <Team />
        <SalesFunnel />
        <SuccessCases />
        <Testimonials />
        <DynamicWhyChooseUs />
        <DynamicBottomWhatsAppForm />
      </main>
      <Footer />
      <DynamicContactModal />
      <AnalyticsProvider />
    </>
  )
}

