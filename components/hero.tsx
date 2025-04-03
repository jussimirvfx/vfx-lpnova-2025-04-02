"use client"

import { useState, useEffect } from "react"
import { WhatsAppForm } from "./whatsapp-form"
import { PlayCircle, ArrowUpRight } from "lucide-react"
import { PresentationModal } from "./presentation-modal"
import dynamic from "next/dynamic"
import Image from "next/image"
import { HeroTitle } from "./hero-title"

// Definir interface para o objeto window
declare global {
  interface Window {
    openPresentationModal?: () => void;
    _fbq?: any;
    fbq?: (action: string, event: string, params?: Record<string, any>) => void;
  }
}

// Renderizando o HeroTitle estaticamente para garantir que seja rápido

// Componentes com carregamento dinâmico para melhorar o LCP
const HeroFotoTime = dynamic(() => import("./hero-fototime").then((mod) => mod.HeroFotoTime), {
  ssr: true,
  loading: () => (
    <div
      className="h-[200px] sm:h-[280px] w-full bg-[#f5f5f5] rounded-[32px] defer-mobile"
      aria-label="Carregando imagem do time VFX"
    />
  ),
})

export function Hero() {
  const [isMobile, setIsMobile] = useState(false)

  // Detectar se estamos no mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    
    // Definir a função global para abrir o modal de apresentação
    if (typeof window !== 'undefined' && !window.openPresentationModal) {
      window.openPresentationModal = () => {
        const modal = document.getElementById("presentationModal");
        if (modal) {
          modal.style.display = "flex";
          document.body.style.overflow = "hidden";
          console.log("[PresentationModal] Modal aberto com sucesso");
        } else {
          console.error("[PresentationModal] Elemento do modal não encontrado");
        }
      };
      console.log("[PresentationModal] Função global definida com sucesso");
    }
  }, [])

  const handlePresentationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Não disparar o evento ViewContent aqui - ele será disparado na página de apresentação
    console.log("[PresentationModal] Botão de apresentação clicado");

    // Abrir modal
    if (window.openPresentationModal) {
      window.openPresentationModal()
    }
  }

  // Adicionar uma classe ao formulário do WhatsApp para que possamos referenciá-lo no JavaScript
  return (
    <>
      <section className="relative pt-8 sm:pt-32 pb-12 sm:pb-14 overflow-hidden">
        {/* Background simplificado para melhor renderização mobile */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-gray-50" />

        <div className="container relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div className="relative">
              {/* Círculos com imagens e texto */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative h-8">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/clientesballs-01-red-68bVa4WiYUpfCjZCIkrDtwL5HnkSMi.webp"
                      alt="Clientes VFX"
                      width={128}
                      height={32}
                      unoptimized={true}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <p className="text-sm font-medium">+ de 3500 empresas confiam no método VFX</p>
                </div>
              </div>

              {/* Componente otimizado para LCP - isolado e estaticamente renderizado */}
              <HeroTitle />

              {/* Rest of the content remains the same */}
              <div className="defer-mobile" style={{ willChange: "auto" }}>
                <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl">
                  Assessoria Comercial com Marketing Digital e Produção de Vídeos que geram resultados mensuráveis para
                  seu negócio
                </p>

                <div className="space-y-4 hero-whatsapp-form">
                  <WhatsAppForm />

                  <button
                    onClick={handlePresentationClick}
                    className="group inline-flex items-center gap-3 px-8 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    <PlayCircle className="w-6 h-6" />
                    <span className="font-medium">Ver apresentação</span>
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Componente carregado com baixa prioridade - não afeta o LCP */}
            <div className="defer-mobile">
              <HeroFotoTime />
            </div>
          </div>
        </div>
      </section>

      {/* Always include the PresentationModal component */}
      <PresentationModal />
    </>
  )
}

