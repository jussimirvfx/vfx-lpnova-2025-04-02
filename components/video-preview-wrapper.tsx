"use client"

import { useState, useEffect } from "react"
import { VideoPreview } from "./video-preview"
import { VideoPreviewMobile } from "./video-preview-mobile"

export function VideoPreviewWrapper() {
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true) // Set to true by default

  // Detectar tamanho da tela e atualizar quando a janela for redimensionada
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar no carregamento inicial
    checkMobile()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", checkMobile)

    // Limpar listener
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Renderizar o componente apropriado com base no tamanho da tela
  return <>{isMobile ? <VideoPreviewMobile /> : <VideoPreview isVisible={isVisible} isDesktop={true} />}</>
}

