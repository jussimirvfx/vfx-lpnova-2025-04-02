import Image from "next/image"

export function Features() {
  const features = [
    {
      title: "Criativos de alta performance!",
      description:
        "Criamos vídeos incríveis e materiais publicitários completos que explicam sua solução e geram resultados.",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/criativos-que-convertem-02-7wxXAFBnIUTHpwU02FwQhfs3lqMAtC.webp",
    },
    {
      title: "Tráfego e Sites que Convertem!",
      description: "Agência digital completa com copywriters, gestores de tráfego e webdesigners.",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sites-que-convertem-01-jpACeLBL3ewtUsYRJkGgyr2zy4ZoJx.webp",
    },
    {
      title: "Ferramenta Comercial Completa",
      description:
        "Sua empresa tem acesso a nosso CRM que integra seu WhatsApp, E-mails, Páginas de Captura e toda a comunicação com seus clientes em um só lugar.",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/crm-vfx-01-n7qBykKkf0mvv2XH186ZiBFXfPU0iW.webp",
    },
  ]

  return (
    <section className="pt-4 pb-16">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ minHeight: "40px" }}>
            Porque NINGUÉM consegue imitar a VFX?
          </h2>
          <p className="text-gray-600">Produtora de Vídeos, Agência Digital e Assessoria Comercial!</p>
        </div>

        {/* Layout para mobile e tablet */}
        <div className="lg:hidden">
          <div className="w-full flex flex-wrap justify-center gap-8">
            {features.slice(0, 2).map((feature, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(50%-1rem)] bg-white rounded-lg shadow-lg p-6 transition-transform hover:-translate-y-1"
              >
                <div className="mb-6 flex justify-center">
                  <div className="relative w-full max-w-[300px] aspect-[3/2]" style={{ minHeight: "200px" }}>
                    <Image
                      src={feature.image || "/placeholder.svg?height=400&width=600"}
                      alt={feature.title}
                      fill
                      unoptimized={true}
                      className="rounded-lg object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                      quality={85}
                      loading="lazy"
                      priority={false}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-center" style={{ minHeight: "28px" }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="w-full flex justify-center mt-8">
            {features.slice(2).map((feature, index) => (
              <div
                key={index + 2}
                className="w-full sm:w-[calc(50%-1rem)] max-w-[600px] bg-white rounded-lg shadow-lg p-6 transition-transform hover:-translate-y-1"
              >
                <div className="mb-6 flex justify-center">
                  <div className="relative w-full max-w-[300px] aspect-[3/2]" style={{ minHeight: "200px" }}>
                    <Image
                      src={feature.image || "/placeholder.svg?height=400&width=600"}
                      alt={feature.title}
                      fill
                      unoptimized={true}
                      className="rounded-lg object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                      quality={85}
                      loading="lazy"
                      priority={false}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-center" style={{ minHeight: "28px" }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Layout para desktop */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 transition-transform hover:-translate-y-1">
              <div className="mb-6 flex justify-center">
                <div className="relative w-full max-w-[300px] aspect-[3/2]" style={{ minHeight: "200px" }}>
                  <Image
                    src={feature.image || "/placeholder.svg?height=400&width=600"}
                    alt={feature.title}
                    fill
                    unoptimized={true}
                    className="rounded-lg object-cover"
                    sizes="(max-width: 640px) 100vw, 300px"
                    quality={85}
                    loading="lazy"
                    priority={false}
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-center" style={{ minHeight: "28px" }}>
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

