"use client"

import Image from "next/image"
import { Users, Award, Lightbulb, Rocket } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Team() {
  const useMobileDetect = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }

      checkMobile()
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }, [])

    return isMobile
  }

  const stats = [
    { icon: Users, value: "43+", label: "Especialistas" },
    { icon: Award, value: "12", label: "Anos de Experiência" },
    { icon: Lightbulb, value: "3.6k", label: "Projetos Entregues" },
    { icon: Rocket, value: "98%", label: "Satisfação" },
  ]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null)
  const isMobile = useMobileDetect()

  // Array of team photos updated with new creation team image
  const teamPhotos = [
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/foto-equipe-editada-03-ToG3VRFfSkjtcAfNwuA6i2OLfFNXrk.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/foto-equipe-editada-03-ToG3VRFfSkjtcAfNwuA6i2OLfFNXrk.webp",
      },
      position: "Time de Resultados",
    },
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-de-criacao-performance-02-639Fop7xno598f3Sw1fDpW6DxDRKe5.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-de-criacao-performance-02-639Fop7xno598f3Sw1fDpW6DxDRKe5.webp",
      },
      position: "Time de Criação para Performance",
    },
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-de-trafego-03-D3l3BUg7YTcOAZ3iNjJB1OTRXQr8Hl.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-de-trafego-03-D3l3BUg7YTcOAZ3iNjJB1OTRXQr8Hl.webp",
      },
      position: "Time de Tráfego Pago",
    },
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-socialmediavfx-IMG_9558ed2-0W86Ezaki0QgyK94Tnc6qNJA0NzbR7.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-socialmediavfx-IMG_9558ed2-0W86Ezaki0QgyK94Tnc6qNJA0NzbR7.webp",
      },
      position: "Time de Social Media Focado em Vendas",
    },
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-customer-sucess-02-zICmjSELQmblg051Y3ToLDwatBULo1.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-customer-sucess-02-zICmjSELQmblg051Y3ToLDwatBULo1.webp",
      },
      position: "Time de Sucesso do Cliente",
    },
    {
      url: {
        mobile:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-automacao-02-t7siKlYQeXbYKbWsYAV11ZDR6GHOFM.webp",
        desktop:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/time-automacao-02-t7siKlYQeXbYKbWsYAV11ZDR6GHOFM.webp",
      },
      position: "Time de Automação e CRM",
    },
  ]

  // Precarregar a primeira imagem no mobile
  useEffect(() => {
    if (isMounted && isMobile && teamPhotos.length > 0) {
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = teamPhotos[0].url.mobile
      document.head.appendChild(link)

      return () => {
        document.head.removeChild(link)
      }
    }
  }, [isMounted, isMobile])

  // Montar componente apenas no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (!isMounted) return

    // Clear any existing timer
    if (autoAdvanceTimer.current) {
      clearInterval(autoAdvanceTimer.current)
    }

    // Set up new timer
    autoAdvanceTimer.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % teamPhotos.length)
    }, 5000) // Change image every 5 seconds

    return () => {
      if (autoAdvanceTimer.current) {
        clearInterval(autoAdvanceTimer.current)
      }
    }
  }, [isMounted])

  // Function to handle manual navigation with timer reset
  const handleManualNavigation = (newIndex: number) => {
    setCurrentImageIndex(newIndex)

    // Reset timer with longer delay before resuming auto-advance
    if (autoAdvanceTimer.current) {
      clearInterval(autoAdvanceTimer.current)

      autoAdvanceTimer.current = setTimeout(() => {
        autoAdvanceTimer.current = setInterval(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % teamPhotos.length)
        }, 5000)
      }, 10000) // 10 second delay before resuming auto-advance
    }
  }

  // Se não estiver montado no cliente, retorna um placeholder
  if (!isMounted) {
    return <div className="h-[600px] bg-gray-50" />
  }

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50" />
      <div className="absolute left-0 top-1/2 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute right-0 bottom-0 w-72 h-72 bg-primary/5 rounded-full blur-2xl" />

      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Conheça seu novo time de <span className="text-primary">Resultados</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Uma equipe multidisciplinar de especialistas prontos para transformar sua presença digital e impulsionar
            seus resultados
          </p>
        </div>

        {/* Grid de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Image slider container */}
        <div className="relative">
          {/* Layout para mobile e tablet */}
          <div className="lg:hidden">
            <div className="w-full">
              <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                {teamPhotos.map((photo, index) => (
                  <Image
                    key={index}
                    src={photo.url.mobile || "/placeholder.svg"}
                    alt={photo.position}
                    fill
                    unoptimized={true}
                    className={`
                      object-cover
                      ${index === 0 || index === teamPhotos.length - 1 ? "object-center" : "object-top"}
                      transition-all duration-700 ease-out
                      ${currentImageIndex === index ? "opacity-100" : "opacity-0"}
                    `}
                    sizes="(max-width: 768px) 640px"
                    quality={75}
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="font-medium">Seu futuro</div>
                  <div className="text-2xl font-bold">{teamPhotos[currentImageIndex].position}</div>
                </div>

                {/* Left side tap area for mobile */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                  onClick={() =>
                    handleManualNavigation(currentImageIndex === 0 ? teamPhotos.length - 1 : currentImageIndex - 1)
                  }
                />

                {/* Right side tap area for mobile */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                  onClick={() =>
                    handleManualNavigation(currentImageIndex === teamPhotos.length - 1 ? 0 : currentImageIndex + 1)
                  }
                />

                {/* Navigation Arrows - Now visible on all screen sizes */}
                <button
                  onClick={() =>
                    handleManualNavigation(currentImageIndex === 0 ? teamPhotos.length - 1 : currentImageIndex - 1)
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 z-20"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() =>
                    handleManualNavigation(currentImageIndex === teamPhotos.length - 1 ? 0 : currentImageIndex + 1)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 z-20"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Layout para desktop */}
          <div className="hidden lg:block">
            <div className="group relative aspect-[21/9] overflow-hidden rounded-2xl bg-gray-100">
              {teamPhotos.map((photo, index) => (
                <Image
                  key={index}
                  src={photo.url.desktop || "/placeholder.svg"}
                  alt={photo.position}
                  fill
                  unoptimized={true}
                  className={`
                    object-cover
                    ${index === 0 || index === teamPhotos.length - 1 ? "object-center" : "object-top"}
                    transition-all duration-700 ease-out
                    ${currentImageIndex === index ? "opacity-100" : "opacity-0"}
                  `}
                  sizes="(min-width: 1024px) 1920px"
                  quality={85}
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="font-medium">Seu futuro</div>
                <div className="text-2xl font-bold">{teamPhotos[currentImageIndex].position}</div>
              </div>

              {/* Left side tap area for desktop */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                onClick={() =>
                  handleManualNavigation(currentImageIndex === 0 ? teamPhotos.length - 1 : currentImageIndex - 1)
                }
              />

              {/* Right side tap area for desktop */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
                onClick={() =>
                  handleManualNavigation(currentImageIndex === teamPhotos.length - 1 ? 0 : currentImageIndex + 1)
                }
              />

              {/* Navigation Arrows */}
              <button
                onClick={() =>
                  handleManualNavigation(currentImageIndex === 0 ? teamPhotos.length - 1 : currentImageIndex - 1)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 z-20"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  handleManualNavigation(currentImageIndex === teamPhotos.length - 1 ? 0 : currentImageIndex + 1)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50 z-20"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Indicadores do slider */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {teamPhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => handleManualNavigation(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentImageIndex === index ? "bg-white w-4" : "bg-white/50"
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

