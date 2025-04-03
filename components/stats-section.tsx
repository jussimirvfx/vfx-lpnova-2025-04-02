"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleChartHover = () => {
    if (!isAnimating) {
      setIsAnimating(true)
      setTimeout(() => {
        setIsAnimating(false)
      }, 1200)
    }
  }

  const bars = [
    { height: 32, index: 0 },
    { height: 40, index: 1 },
    { height: 48, index: 2 },
  ].sort((a, b) => a.height - b.height)

  return (
    <section className="pt-6 pb-16 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column - Stats Card */}
          <div className="w-full">
            <div
              className={`
                bg-black rounded-2xl sm:rounded-3xl 
                p-5 sm:p-6 md:p-8
                relative overflow-hidden 
                min-h-[180px] sm:min-h-[280px] md:min-h-[300px]
                flex flex-col justify-center
                transition-all duration-700 ease-out delay-300
                hover:shadow-xl hover:shadow-black/20
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
            >
              {/* Content - Display as flex for mobile with better spacing */}
              <div className="flex flex-row items-center h-full px-2">
                {/* Text Column - With fixed padding to align with margins */}
                <div className="relative z-10 space-y-2 md:space-y-3 w-3/5">
                  <p className="text-white/80 text-sm sm:text-base">3500+ Empresas Atendidas</p>
                  <h3 className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-snug">
                    Atendemos desde pequenas empresas e startups até grandes indústrias e{" "}
                    <span className="text-[#2563eb]">multinacionais</span>.
                  </h3>
                </div>

                {/* Chart Column - More space and right-aligned */}
                <div className="flex items-end h-full w-2/5 justify-end">
                  <div className="flex items-end gap-2" onMouseEnter={handleChartHover}>
                    {bars.map(({ height, index }) => (
                      <div key={height} className="group">
                        <div
                          className={`
                            w-6 sm:w-7 md:w-8 lg:w-10 rounded-t-lg 
                            transition-all duration-700 ease-out
                            bg-[#2563eb]
                            hover:shadow-lg
                            hover:shadow-blue-500/50
                            hover:brightness-110
                          `}
                          style={{
                            height: `${height * 2.2}px`, // Mobile height
                            ...(typeof window !== "undefined" &&
                              window.innerWidth >= 640 && {
                                height: `${height * 2.5}px`, // Tablet height
                              }),
                            ...(typeof window !== "undefined" &&
                              window.innerWidth >= 768 && {
                                height: `${height * 2.8}px`, // Desktop height
                              }),
                            opacity: 0.6 + index * 0.2,
                            transform: isAnimating ? "scaleY(1.15)" : "scaleY(1)",
                            transitionDelay: isAnimating ? `${index * 150}ms` : "0ms",
                            transformOrigin: "bottom",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Certifications */}
          <div className="w-full">
            <div
              className={`
                bg-white rounded-3xl p-6 sm:p-8
                h-auto sm:h-[300px]
                border border-gray-100
                transition-all duration-700 ease-out delay-300
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
            >
              <div className="h-full flex flex-col">
                <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-6 items-center justify-items-center">
                  {[
                    {
                      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/linkedin-partner-rDqwMTFskRYuMiCiTJDt7BsIZq8xLC.webp",
                      alt: "LinkedIn Marketing Partner",
                      delay: "0ms",
                    },
                    {
                      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/top-video-marketing-companies-2024-QdxIJXdkRG8Odq1rZThoebpe7k3Qb0.webp",
                      alt: "DesignRush Top Video Marketing Companies 2024",
                      delay: "200ms",
                    },
                    {
                      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/meta-Qk7H1wuVWmwVJXL2UAUrKkIUJbm3DN.webp",
                      alt: "Meta Business Partner",
                      delay: "400ms",
                    },
                    {
                      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-parter-2-n24UOFC6vFhMDt2nSuQizmapoX3KuJ.webp",
                      alt: "Google Partner",
                      delay: "600ms",
                    },
                  ].map((cert, index) => (
                    <div
                      key={index}
                      className="relative w-full max-w-[140px] sm:max-w-[150px] aspect-[5/3] transition-all duration-500 ease-out group"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transitionDelay: cert.delay,
                      }}
                    >
                      <div
                        className="absolute inset-0 transition-all duration-300 ease-out group-hover:translate-y-[-4px] group-hover:scale-105 group-hover:filter group-hover:brightness-110"
                        style={{
                          transitionDelay: `${index * 50}ms`,
                        }}
                      >
                        <Image
                          src={cert.src || "/placeholder.svg"}
                          alt={cert.alt}
                          fill
                          unoptimized={true}
                          className="object-contain transition-opacity"
                          sizes="180px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

