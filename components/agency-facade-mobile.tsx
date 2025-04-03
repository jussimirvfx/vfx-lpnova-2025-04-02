"use client"

import Image from "next/image"

export function AgencyFacadeMobile() {
  return (
    <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
      {/* Overlay simplificado para mobile */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Usando a mesma imagem que funciona no desktop */}
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fachada-vfx-2-Q21nruSwlKnCsBRJRorIkzw8roo3I0.webp"
        alt="Fachada da agência VFX"
        fill
        unoptimized={true}
        className="object-cover"
        sizes="100vw"
        loading="eager"
        priority={true}
        width={400}
        height={300}
        quality={70}
        onLoad={(e) => {
          console.log("Imagem da fachada mobile carregada")
        }}
        onError={(e) => {
          console.error("Erro ao carregar imagem da fachada mobile", e)
        }}
      />

      {/* Ícone de check */}
      <div className="absolute left-4 top-4 z-20">
        <div className="bg-black rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="2">
            <path d="M3 17L9 11L13 15L21 7" className="stroke-[#2563eb]" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

