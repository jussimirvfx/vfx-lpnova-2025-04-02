"use client"

import Image from "next/image"

const IMAGE_DIMENSIONS = {
  fachada: {
    width: 600,
    height: 400,
  },
}

interface AgencyFacadeProps {
  isDesktop: boolean
  hoveredColumn: "left" | "right" | null
  onHover: (value: "left" | "right" | null) => void
}

export function AgencyFacade({ isDesktop, hoveredColumn, onHover }: AgencyFacadeProps) {
  return (
    <div
      className="h-full"
      onMouseEnter={() => isDesktop && onHover("left")}
      onMouseLeave={() => isDesktop && onHover(null)}
    >
      <div
        className={`
          relative h-[240px] sm:h-[280px]
          ${isDesktop ? "transition-all duration-300 ease-out" : ""}
          sm:rounded-tr-[200px] rounded-br-3xl overflow-hidden
          ${hoveredColumn === "left" && isDesktop ? "shadow-lg" : ""}
        `}
      >
        <div
          className={`
            absolute inset-0 bg-black/40 z-10
            ${isDesktop ? "transition-opacity duration-300" : ""}
            ${hoveredColumn === "left" && isDesktop ? "opacity-30" : "opacity-40"}
          `}
        />

        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fachada-vfx-2-Q21nruSwlKnCsBRJRorIkzw8roo3I0.webp"
          alt="Fachada da agência VFX"
          fill
          unoptimized={true}
          className={`
            object-cover 
            ${isDesktop ? "transition-transform duration-700" : ""}
            ${hoveredColumn === "left" && isDesktop ? "scale-105" : "scale-100"}
          `}
          sizes="(max-width: 640px) 100vw, 50vw"
          loading="eager"
          priority={true}
          width={600}
          height={400}
          quality={70}
        />
      </div>
      <div
        className={`
          absolute 
          ${
            isDesktop
              ? `
              right-[10px] top-8
              translate-x-0
              ${hoveredColumn === "left" ? "translate-x-[10px]" : ""}
              ${hoveredColumn === "right" ? "translate-x-0" : ""}
              `
              : `
              left-4 top-8
              transform-none
              `
          }
          ${isDesktop ? "transition-all duration-300" : ""} 
          z-20
        `}
      >
        <div
          className={`
            bg-black rounded-full
            ${isDesktop ? "w-16 h-16 sm:w-20 sm:h-20" : "w-20 h-20"}
            flex items-center justify-center
            ${isDesktop ? "transition-all duration-300 cursor-pointer" : ""}
            ${hoveredColumn && isDesktop ? "shadow-xl scale-125" : "shadow-lg"}
          `}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`
              w-8 h-8 sm:w-10 sm:h-10 
              ${isDesktop ? "transition-transform duration-300" : ""}
              ${hoveredColumn && isDesktop ? "scale-110" : ""}
            `}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 17L9 11L13 15L21 7"
              className={`
                stroke-[#2563eb] 
                ${isDesktop ? "transition-colors duration-300" : ""}
                ${hoveredColumn && isDesktop ? "stroke-[#3b82f6]" : ""}
              `}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

