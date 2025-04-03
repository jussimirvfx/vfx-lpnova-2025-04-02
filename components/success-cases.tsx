import Image from "next/image"

export function SuccessCases() {
  const cases = [
    {
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case-fumil-800w-450a-O3XmnyRM3BRvWlROlMPcYeuAYAOLpN.webp",
      title: "Indústria - Campanha B2B Revendedores",
      description:
        "114X de melhora no tempo de atendimento nos canais digitais, videos incríveis, R$150.213,54 em vendas nos primeiros 60 dias de campanha, uma nova landing page e melhora na presença online de Social Media da empresa foram apenas algumas dos resultados já nos primeiros meses desse projeto.",
      tags: ["Transformação Digital", "Estratégia de Vendas"],
    },
    {
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case-miaposenta-02-6PrjdeoctYahOdfDJHzHTfMoVWMzvM.webp",
      title: "Serviços - Advocacia Previdenciária",
      description:
        "Criação de Vídeomarketing, Landing Page, Chatbot de captura de leads e geração de 791 leads qualificados com o valor de R$ 2,09 por conversão já no segundo mês de campanha",
      tags: ["Geração de Leads", "Marketing Jurídico"],
    },
    {
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case-alltec-01-TzWcxiXt8l37ihuYbDdQ8EjcWavvEb.webp",
      title: "Serviços - Assistência Técnica Multimarcas",
      description:
        "Implementação de páginas de captura, criação de vídeos, chatbot, campanhas no Instagram e Google Ads e 1616 leads (pedidos de orçamento) de público final nos últimos 30 dias",
      tags: ["Captação de Clientes", "Marketing de Serviços"],
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Resultados Comprovados</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conheça alguns dos nossos casos de sucesso em videomarketing e marketing digital
          </p>
        </div>

        {/* Layout para mobile e tablet */}
        <div className="lg:hidden">
          <div className="w-full flex flex-wrap justify-center gap-8">
            {cases.slice(0, 2).map((case_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(50%-1rem)] bg-white rounded-xl overflow-hidden transition-transform hover:-translate-y-1 group"
              >
                <div className="aspect-[2/1] relative overflow-hidden">
                  <Image
                    src={case_.image || "/placeholder.svg"}
                    alt={case_.title}
                    fill
                    unoptimized={true}
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{case_.title}</h3>
                  <p className="text-gray-600 mb-4">{case_.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {case_.tags.map((tag) => (
                      <span key={tag} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full flex justify-center mt-8">
            {cases.slice(2).map((case_, index) => (
              <div
                key={index + 2}
                className="w-full sm:w-[calc(50%-1rem)] max-w-[600px] bg-white rounded-xl overflow-hidden transition-transform hover:-translate-y-1 group"
              >
                <div className="aspect-[2/1] relative overflow-hidden">
                  <Image
                    src={case_.image || "/placeholder.svg"}
                    alt={case_.title}
                    fill
                    unoptimized={true}
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{case_.title}</h3>
                  <p className="text-gray-600 mb-4">{case_.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {case_.tags.map((tag) => (
                      <span key={tag} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout para desktop */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          {cases.map((case_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden transition-transform hover:-translate-y-1 group"
            >
              <div className="aspect-[2/1] relative overflow-hidden">
                <Image
                  src={case_.image || "/placeholder.svg"}
                  alt={case_.title}
                  fill
                  unoptimized={true}
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={85}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{case_.title}</h3>
                <p className="text-gray-600 mb-4">{case_.description}</p>
                <div className="flex flex-wrap gap-2">
                  {case_.tags.map((tag) => (
                    <span key={tag} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

