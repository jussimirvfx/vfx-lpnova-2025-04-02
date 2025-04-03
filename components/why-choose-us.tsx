"use client"

import type React from "react"

import { Award, BarChart, HeadphonesIcon } from "lucide-react"

export function WhyChooseUs() {
  const reasons = [
    {
      icon: Award,
      title: "Profissionais Certificados & Especialistas",
      description:
        "Nossa equipe é formada por profissionais certificados com anos de experiência em marketing digital e produção audiovisual.",
    },
    {
      icon: BarChart,
      title: "Resultados Rápidos e Mensuráveis",
      description:
        "Utilizamos métricas claras e relatórios detalhados para acompanhar e otimizar cada campanha em tempo real.",
    },
    {
      icon: HeadphonesIcon,
      title: "Suporte Premium",
      description:
        "Conte com nossa equipe de suporte dedicada para atender suas necessidades a qualquer momento, garantindo o sucesso do seu projeto.",
    },
  ]

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const contactSection = document.querySelector(".py-16.bg-gray-900")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden relative">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute w-64 h-64 bg-primary/5 rounded-full -left-32 -top-32" />
            <div className="relative">
              <span className="text-primary font-semibold mb-4 block">POR QUE ESCOLHER A VFX?</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Estamos aqui para garantir sua satisfação e resultados.
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Com mais de 3500 empresas atendidas, nossa metodologia comprovada combina estratégia, criatividade e
                tecnologia para entregar resultados excepcionais em marketing digital e produção de vídeos.
              </p>
              <button
                onClick={handleContactClick}
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Fale Conosco
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="flex gap-6 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <reason.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{reason.title}</h3>
                  <p className="text-gray-600">{reason.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

