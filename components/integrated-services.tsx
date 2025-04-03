"use client"

import { Megaphone, TrendingUp, Video } from "lucide-react"
import { useEffect, useState } from "react"

export function IntegratedServices() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const services = [
    {
      icon: Megaphone,
      title: "Agência Digital",
      description: "Marketing Digital e Performance",
    },
    {
      icon: TrendingUp,
      title: "Estruturação Comercial",
      description: "Funis de Vendas e CRM",
    },
    {
      icon: Video,
      title: "Produtora de Vídeos",
      description: "Conteúdo que Converte",
    },
  ]

  return (
    <section className="pt-6 pb-8 sm:pt-8 sm:pb-12 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Services Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-6 relative">
              {services.map((service, index) => (
                <div
                  key={service.title}
                  className={`
                    relative text-center 
                    transition-all duration-700 ease-out
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                  `}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Plus Sign (between items) */}
                  {index < services.length - 1 && (
                    <div className="hidden sm:flex absolute -right-3 top-12 transform translate-x-1/2 -translate-y-1/2 text-4xl text-gray-300 font-light">
                      +
                    </div>
                  )}

                  {/* Icon Container */}
                  <div className="mb-3 sm:mb-6 group">
                    <div
                      className={`
                  w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-xl sm:rounded-2xl bg-white
                  flex items-center justify-center
                  transition-all duration-300
                  shadow-md sm:shadow-lg
                  group-hover:shadow-xl group-hover:-translate-y-1
                  group-hover:bg-primary/5
                `}
                    >
                      <service.icon
                        className={`
                    w-8 h-8 sm:w-12 sm:h-12 transition-colors duration-300
                    text-gray-900 group-hover:text-primary
                  `}
                      />
                    </div>
                  </div>

                  {/* Text Content */}
                  <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2">{service.title}</h3>
                  <p className="text-xs sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-none">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

