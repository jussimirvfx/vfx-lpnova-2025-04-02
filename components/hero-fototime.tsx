"use client"

import { useState, useEffect } from "react"
import { VideoPreviewWrapper } from "./video-preview-wrapper"
import { AgencyFacade } from "./agency-facade"
import { StatsCard } from "./stats-card"
import { HeroFotoTimeMobile } from "./hero-fototime-mobile"

export function HeroFotoTime() {
  const [isVisible, setIsVisible] = useState(true) // Set to true by default
  const [isDesktop, setIsDesktop] = useState(false)
  const [hoveredColumn, setHoveredColumn] = useState<"left" | "right" | null>(null)
  const [progress, setProgress] = useState(50) // Start at 50% by default

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 640)
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)

    return () => {
      window.removeEventListener("resize", checkDesktop)
    }
  }, [])

  // Renderize a versão mobile em telas pequenas
  if (!isDesktop) {
    return <HeroFotoTimeMobile />
  }

  // Versão desktop original
  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Video Preview */}
      <div className="opacity-100 translate-y-0">
        <VideoPreviewWrapper />
      </div>

      {/* Container for Agency Facade and Stats Card */}
      <div className="relative bg-white rounded-3xl overflow-hidden flex flex-col sm:flex-row h-auto sm:h-[280px]">
        {/* Agency Facade */}
        <div className="w-full sm:w-[50%] opacity-100 translate-y-0">
          <AgencyFacade
            isDesktop={isDesktop}
            hoveredColumn={hoveredColumn}
            onHover={(value) => setHoveredColumn(value)}
          />
        </div>

        {/* Stats Card */}
        <div className="w-full sm:w-[50%] opacity-100 translate-y-0">
          <StatsCard
            isDesktop={isDesktop}
            progress={progress}
            hoveredColumn={hoveredColumn}
            onHover={(value) => setHoveredColumn(value)}
            setProgress={setProgress}
          />
        </div>
      </div>
    </div>
  )
}

