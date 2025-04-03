"use client"

import Image from "next/image"
import { Play } from "lucide-react"
import { useVideoTracking } from "@/lib/hooks/use-video-tracking"

export function VideoPreviewMobile() {
  // Configuração do vídeo para rastreamento
  const videoMetadata = {
    content_name: "Apresentação VFX Mobile",
    content_id: "apresentacao-vfx-mobile",
    content_category: "Product Presentation Mobile",
    video_duration: 180 // duração aproximada em segundos
  }
  
  // Usar o hook de rastreamento
  const { trackStart } = useVideoTracking(videoMetadata)

  // Direct handler to open the modal
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
      className="relative w-full text-left block active:scale-[0.99] transition-transform"
      aria-label="Assistir apresentação"
      style={{ minHeight: "200px" }} // Altura mínima fixa para evitar layout shift
    >
      <div className="relative bg-[#f5f5f5] rounded-[32px] overflow-hidden h-[200px] w-full">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-vfx-janeiro2025-mobile-640x360-LUeXL8YMBiZJCrziKhe5k44GhcNiGa.webp"
          alt="Time VFX Janeiro 2025"
          fill
          unoptimized={true}
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 640px"
          quality={75}
          priority={true}
          loading="eager"
        />

        {/* Versão Mobile - Otimizada para AMP/PWA - Sem animações */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90 active:bg-gradient-to-b active:from-black/70 active:to-black/95 transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 video-preview-mobile-content">
            <p className="text-white text-lg font-medium text-center mb-2">Toque para assistir nossa apresentação</p>
            <div
              className="w-14 h-14 rounded-full bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/30 pulse-animation"
              style={{
                animation: "pulse 2s infinite",
              }}
            >
              <Play className="w-7 h-7 text-white" fill="currentColor" strokeWidth={0} />
            </div>
            <style jsx>{`
              @keyframes pulse {
                0% {
                  transform: scale(1);
                  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
                }
                
                70% {
                  transform: scale(1.05);
                  box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
                }
                
                100% {
                  transform: scale(1);
                  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                }
              }
              
              .pulse-animation {
                animation: pulse 2s infinite;
                -webkit-animation: pulse 2s infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
    </button>
  )
}

