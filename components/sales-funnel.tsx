"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowDownCircle, Target, Zap, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"

export function SalesFunnel() {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [visibleStep, setVisibleStep] = useState<number | null>(null) // Adicione um novo estado para rastrear qual etapa está visível durante o scroll
  const sectionRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]) // Adicione refs para cada etapa
  const [isMobile, setIsMobile] = useState(false)

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Check if section is visible on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  // Adicione este useEffect para configurar o Intersection Observer para cada etapa
  useEffect(() => {
    // Se for dispositivo móvel, não configure o observer
    if (isMobile) {
      return
    }

    const observers: IntersectionObserver[] = []

    stepRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleStep(index)
              }
            })
          },
          { threshold: 0.6 }, // Ajuste este valor para controlar quando o destaque é ativado
        )

        observer.observe(ref)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [isMobile]) // Adicione isMobile como dependência

  const steps = [
    {
      icon: Target,
      title: "Atrair",
      description: "Estratégias focadas para alcançar seu cliente ideal",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/atrair-CnW5luZj4IF395ml2MQ35sX8ZqC52Y.webp",
      items: [
        "Pesquisa de concorrência",
        "Desenvolvimento de Persona e ICP",
        "Criativos estáticos e vídeos",
        "Tráfego com otimização diária",
        "Retroalimentação do Algoritmo com IA",
      ],
    },
    {
      icon: ArrowDownCircle,
      title: "Converter",
      description: "Transformação de visitantes em leads qualificados",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/converter-01-oGYC4P9BThXcEmbzVMh4JCkjNLBpEY.webp",
      items: [
        "Criação e atualização de site otimizados para conversão e vendas",
        "Formulários integrados ao CRM",
        "Chatbots customizados",
        "Vídeos animados explicativos",
      ],
    },
    {
      icon: Zap,
      title: "Vender",
      description: "Fechamento de vendas com alta taxa de sucesso",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vender.jpg-AwC7wr4X2P6nrCoRFa7AT81u647IO1.jpeg",
      items: [
        "Plataforma comercial com:",
        "CRM",
        "Central de atendimento",
        "WhatsApp e Instagram conectados",
        "Usuários ilimitados",
        "Treinamento comercial para atendimento dos leads",
      ],
    },
  ]

  // Modifique a função toggleStep para manter a funcionalidade existente
  const toggleStep = (index: number) => {
    if (activeStep === index) {
      setActiveStep(null)
    } else {
      setActiveStep(index)
      // Apenas atualize visibleStep em desktop
      if (!isMobile) {
        setVisibleStep(index)
      }
    }
  }

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Aumente Suas Vendas com Nossa Metodologia Comprovada</h2>
          <p className="text-gray-600 text-lg">
            Um processo estruturado em 3 etapas para maximizar seus resultados e garantir o sucesso do seu negócio
          </p>
        </div>

        <div className="relative">
          {/* Linha conectora animada */}
          <div className="absolute hidden sm:block left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 -translate-x-1/2">
            <div
              className="absolute top-0 w-full bg-primary"
              style={{
                height: isVisible ? "100%" : "0%",
                transition: "height 1.5s ease-out",
                transitionDelay: "0.5s",
              }}
            />
          </div>

          <div className="grid gap-12 lg:gap-16">
            {steps.map((step, index) => (
              <div
                key={index}
                ref={(el) => (stepRefs.current[index] = el)} // Adicione a referência para cada etapa
                className={`
                  relative 
                  transition-all duration-500 
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}
                `}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Círculo conector animado */}
                <div
                  className={`
                    hidden sm:block absolute left-1/2 top-28 w-4 h-4 rounded-full 
                    -translate-x-1/2 shadow-lg shadow-primary/30
                    transition-all duration-500
                    ${isVisible ? "bg-primary scale-100" : "bg-primary/30 scale-0"}
                    ${visibleStep === index ? "ring-4 ring-primary/20" : ""}
                  `}
                  style={{ transitionDelay: `${700 + index * 200}ms` }}
                />

                <div
                  className={`
                    grid sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center 
                    ${index % 2 === 0 ? "" : "sm:[&>*:first-child]:order-2"}
                    ${visibleStep === index ? "bg-white/50 rounded-xl p-4 shadow-sm" : ""}
                    transition-all duration-300
                  `}
                >
                  {/* Conteúdo */}
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-4 cursor-pointer" onClick={() => toggleStep(index)}>
                      <div
                        className={`
                          w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner
                          transition-all duration-300
                          ${activeStep === index || visibleStep === index ? "bg-primary text-white" : "bg-primary/10"}
                        `}
                      >
                        <step.icon
                          className={`w-8 h-8 ${activeStep === index || visibleStep === index ? "text-white" : "text-primary"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1">{step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                      <div className="flex-shrink-0 md:hidden">
                        {activeStep === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div
                      className={`
                        bg-white p-6 rounded-xl shadow-sm
                        transition-all duration-500 overflow-hidden
                        ${activeStep === index || activeStep === null ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-[500px] md:opacity-100"}
                      `}
                    >
                      <ul className="space-y-3">
                        {step.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className={`
                                w-1.5 h-1.5 rounded-full mt-2.5
                                transition-all duration-300
                                ${activeStep === index || visibleStep === index ? "bg-primary scale-125" : "bg-primary"}
                              `}
                            />
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Imagem com hover effect */}
                  <div
                    className={`
                      relative aspect-[4/3] rounded-2xl overflow-hidden
                      transition-all duration-500
                      ${activeStep === index || visibleStep === index ? "shadow-xl shadow-primary/20" : "shadow-lg"}
                      hover:shadow-xl hover:shadow-primary/20
                    `}
                  >
                    <Image
                      src={step.image || "/placeholder.svg"}
                      alt={`Ilustração do processo de ${step.title.toLowerCase()}`}
                      fill
                      unoptimized={true}
                      width={800}
                      height={600}
                      className={`
                        object-cover
                        transition-transform duration-700 ease-out
                        ${activeStep === index || visibleStep === index ? "scale-105" : "scale-100"}
                        hover:scale-105
                      `}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={85}
                      loading="lazy"
                      priority={false}
                    />
                    <div
                      className={`
                        absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
                        transition-opacity duration-300
                        ${activeStep === index || visibleStep === index ? "opacity-70" : "opacity-0"}
                        hover:opacity-70
                      `}
                    />
                    <div
                      className={`
                        absolute bottom-0 left-0 right-0 p-6 text-white
                        transition-all duration-300
                        ${activeStep === index || visibleStep === index ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}
                        hover:translate-y-0 hover:opacity-100
                      `}
                    >
                      <h4 className="text-xl font-bold">{step.title}</h4>
                      <p className="text-white/80">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

