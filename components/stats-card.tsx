"use client"

import { useEffect } from "react"

interface StatsCardProps {
  isDesktop: boolean
  progress: number
  hoveredColumn: "left" | "right" | null
  onHover: (value: "left" | "right" | null) => void
  setProgress: (value: number) => void
}

export function StatsCard({ isDesktop, progress, hoveredColumn, onHover, setProgress }: StatsCardProps) {
  useEffect(() => {
    if (!isDesktop) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setProgress(50)
            }
          })
        },
        { threshold: 0.5 },
      )

      const element = document.querySelector("#stats-card")
      if (element) {
        observer.observe(element)
      }

      return () => observer.disconnect()
    }
  }, [isDesktop, setProgress])

  return (
    <div
      className="h-full flex items-center p-0 sm:p-4 sm:pl-4 sm:pr-0 relative z-[-1]"
      onMouseEnter={() => isDesktop && onHover("right")}
      onMouseLeave={() => isDesktop && onHover(null)}
    >
      <div
        id="stats-card"
        className={`
    bg-[#f5f5f5] h-[180px] sm:h-[280px] w-full
    p-6 sm:p-8
    rounded-3xl
    ${isDesktop ? "transition-all duration-300 ease-out" : ""}
    flex flex-col
    mt-4 sm:mt-0
    ${hoveredColumn === "right" && isDesktop ? "bg-[#f0f0f0] translate-y-[-4px] shadow-lg" : ""}
    relative z-[-2]
  `}
      >
        <div className="flex-1 mt-0 sm:mt-0">
          <h2
            className={`
      text-2xl sm:text-2xl lg:text-3xl font-bold 
      ${isDesktop ? "transition-transform duration-300" : ""}
      ${hoveredColumn === "right" && isDesktop ? "scale-105" : ""}
      mb-2 sm:mb-3
    `}
          >
            R$ 8.2 Milhões<span className="text-[#2563eb]">+</span>
          </h2>
          <p className="text-gray-600 text-base sm:text-sm lg:text-base leading-relaxed">
            Em tráfego gerenciado em campanhas de sucesso para empresas em todo o Brasil
          </p>
        </div>
        <div className="w-full">
          <div className="h-0.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`
            h-full rounded-full 
            ${isDesktop ? "transition-all duration-1000 ease-out" : ""}
            ${hoveredColumn === "right" && isDesktop ? "bg-[#2563eb]" : "bg-black"}
          `}
              style={{
                width: hoveredColumn === "right" && isDesktop ? "100%" : `${progress}%`,
                transitionTimingFunction: isDesktop ? "cubic-bezier(0.34, 1.56, 0.64, 1)" : "ease-out",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

