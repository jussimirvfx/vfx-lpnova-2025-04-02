"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { useVideoTracking } from "@/lib/hooks/use-video-tracking"

export function VideoPreview({ isVisible = true, isDesktop = true }) {
  const [hoveredVideo, setHoveredVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Configuração do vídeo para rastreamento
  const videoMetadata = {
    content_name: "Apresentação VFX",
    content_id: "apresentacao-vfx-main",
    content_category: "Product Presentation",
    video_duration: 180 // duração aproximada em segundos
  }
  
  // Usar o hook de rastreamento
  const { trackStart } = useVideoTracking(videoMetadata)

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Rastrear início da visualização do vídeo usando o hook
    trackStart()

    // Use the global function to open the modal
    if (window.openPresentationModal) {
      window.openPresentationModal()
    }
  }

  return (
    <button
      onClick={handleVideoClick}
      className="relative w-full text-left block group/video z-30"
      onMouseEnter={() => setHoveredVideo(true)}
      onMouseLeave={() => setHoveredVideo(false)}
      style={{ minHeight: "280px" }} // Altura mínima fixa para evitar layout shift
    >
      <div
        className={`
          relative bg-[#f5f5f5] rounded-[32px] overflow-hidden
          transition-all duration-700 ease-out
          h-[280px] w-full
          group-hover/video:shadow-xl
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-vfx-janeiro2025-01-J9DciN1bitBBew1VXRIqqJGY97JaO2.webp"
          alt="Time VFX Janeiro 2025"
          fill
          unoptimized={true}
          className="object-cover object-top transition-transform duration-700 ease-out group-hover/video:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={85}
          priority={true}
          loading="eager"
        />

        <div
          className={`
            absolute inset-0 
            bg-gradient-to-b from-black/10 to-black/40
            transition-all duration-300
            opacity-40
            hover:opacity-30
            flex flex-col items-center justify-center gap-4
            cursor-pointer
          `}
        ></div>

        <video ref={videoRef} className="hidden" playsInline>
          <source src="URL_DO_SEU_VIDEO" type="video/mp4" />
        </video>
      </div>

      <div
        className={`
          absolute -bottom-6 -right-6 z-40
          translate-x-[-12px] translate-y-[-12px]
          transition-all duration-500 ease-out group-hover/video:translate-x-[-8px] group-hover/video:translate-y-[-8px]
        `}
      >
        <div className="relative animate-[buttonPulse_4s_ease-in-out_infinite]">
          {/* Fundo branco base - mais grosso para criar a borda */}
          <div className="absolute inset-[-8px] bg-white rounded-full z-10"></div>

          {/* Botão azul principal */}
          <div
            className={`
              relative w-24 h-24 lg:w-28 lg:h-28 rounded-full z-20
              bg-[#2563eb] text-white
              flex items-center justify-center
              transition-all duration-500 ease-out
              group-hover/video:scale-110 group-hover/video:shadow-lg group-hover/video:shadow-blue-500/25
            `}
          >
            <Play
              className="w-10 h-10 lg:w-12 lg:h-12 transition-all duration-500 ease-out group-hover/video:scale-110 group-hover/video:translate-x-[2px] relative z-10"
              fill="currentColor"
              strokeWidth={0}
            />

            {/* Círculos de radiação com z-index maior que o fundo branco */}
            <div className="absolute inset-[-20%] rounded-full z-50">
              <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-[circlePing_3s_cubic-bezier(0,0,0.2,1)_infinite] z-50"></span>
              <span
                className="absolute inset-0 rounded-full bg-blue-500/15 animate-[circlePing_3.5s_cubic-bezier(0,0,0.2,1)_infinite] z-50"
                style={{ animationDelay: "0.7s" }}
              ></span>
              <span
                className="absolute inset-0 rounded-full bg-blue-500/10 animate-[circlePing_4s_cubic-bezier(0,0,0.2,1)_infinite] z-50"
                style={{ animationDelay: "1.4s" }}
              ></span>
            </div>
          </div>
        </div>
      </div>

      {/* Adicionar estilos de animação personalizados */}
      <style jsx global>{`
        @keyframes circlePing {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          75%, 100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        @keyframes buttonPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </button>
  )
}

