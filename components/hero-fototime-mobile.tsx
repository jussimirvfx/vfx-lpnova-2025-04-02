"use client"

import { VideoPreviewMobile } from "./video-preview-mobile"
import { AgencyFacadeMobile } from "./agency-facade-mobile"
import { StatsCardMobile } from "./stats-card-mobile"
import { useEffect, useState } from "react"

export function HeroFotoTimeMobile() {
  // Garantir que o componente seja montado corretamente
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    console.log("HeroFotoTimeMobile montado")
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-4">
      {/* Video Preview - usando o componente específico para mobile */}
      <div className="opacity-100">
        <VideoPreviewMobile />
      </div>

      {/* Container para Agency Facade e Stats Card */}
      <div className="flex flex-col space-y-4">
        {/* Agency Facade */}
        <div className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
          <AgencyFacadeMobile />
        </div>

        {/* Stats Card */}
        <div className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
          <StatsCardMobile />
        </div>
      </div>
    </div>
  )
}

