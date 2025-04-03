"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useVideoTracking } from "@/lib/hooks/use-video-tracking"

export function ThankYouVideo() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const videoId = "T0UGbc6bvxA"
  const videoDuration = 120 // duração aproximada em segundos

  // Usar o hook de rastreamento de vídeo
  const { trackStart, trackProgress } = useVideoTracking({
    content_name: "Mensagem da VFX Agência",
    content_id: videoId,
    content_url: `https://www.youtube.com/embed/${videoId}`,
    content_category: "Thank You Video",
    video_duration: videoDuration,
  })

  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true)
  }, [])

  // Rastrear progresso do vídeo quando o usuário estiver assistindo
  useEffect(() => {
    if (!isPlaying) return;
    
    // Configurar intervalo para monitorar progresso
    const intervalId = setInterval(() => {
      // Simular progresso do vídeo (idealmente, usaria a API do YouTube)
      setCurrentTime(prev => {
        const newTime = Math.min(prev + 1, videoDuration);
        
        // Calcular porcentagem atual e rastrear progresso
        const currentPercent = Math.round((newTime / videoDuration) * 100);
        trackProgress(currentPercent);
        
        // Se atingir o final, parar o intervalo
        if (newTime >= videoDuration) {
          clearInterval(intervalId);
          setIsPlaying(false);
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isPlaying, trackProgress, videoDuration]);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setCurrentTime(0);
    
    // Rastrear início do vídeo usando o hook
    trackStart();
  }

  return (
    <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden relative">
      {isPlaying ? (
        <iframe
          ref={videoRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full absolute inset-0"
        ></iframe>
      ) : (
        <div className="flex flex-col items-center justify-center h-full relative">
          {isLoaded && (
            <>
              <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tb-videodaniel-obrigado-3-I1qmcjgNwfUHMih1tBVSlVtuXR32kb.webp"
                alt="Mensagem da VFX Agência"
                fill
                style={{ objectFit: "cover" }}
                className="z-0"
                priority
                unoptimized
              />
              <div
                onClick={handlePlayClick}
                className="z-10 bg-blue-600 hover:bg-blue-700 w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative transition-transform transform hover:scale-110 shadow-lg"
              >
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
              </div>
              <p className="z-10 text-white font-medium mt-4 text-center px-4">
                Clique para assistir nossa mensagem especial
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

