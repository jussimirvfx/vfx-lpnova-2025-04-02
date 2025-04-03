import Image from "next/image"

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "Estamos muito satisfeitos com o trabalho do time da VFX, e sabemos que esse é só o começo de uma parceria duradoura!",
      author: "André",
      role: "CEO",
      company: "Indústria Fumil",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/testemunho-andre-01-yUTub2wLTkl9ZjfvnmlnSw7eMZZQaj.webp",
    },
    {
      quote:
        "A Agência VFX transformou completamente meu negócio. Com estratégias inteligentes de marketing digital, conseguimos multiplicar nossos leads e aumentar significativamente as ligações e pedidos de orçamento para nossa assistência técnica.",
      author: "Bruno Henrique",
      role: "CEO",
      company: "Alltec",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/testemunho-bruno-henrique-01-AQz7hqW46smApe578RIQI3V0MW8wwK.webp",
    },
    {
      quote:
        "Já trabalhei com algumas das maiores agências do país, e sinceramente as outras não me atenderam com metade do profissionalismo com que fui atendido pelo time da VFX",
      author: "Leo Delnero",
      role: "Sócio",
      company: "Massuqueto del Nero Advogados",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/massuqueto-01-7O3N0aTxjZYtZ2SKuSvFD95cb3czAi.webp",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O que Nossos Clientes Dizem</h2>
          <p className="text-gray-600 max-w-2xl mx-auto whitespace-nowrap overflow-hidden text-overflow-ellipsis">
            Resultados reais de empresas que transformaram seu marketing digital com a Agência VFX
          </p>
        </div>

        {/* Layout para mobile e tablet */}
        <div className="lg:hidden">
          <div className="w-full flex flex-wrap justify-center gap-8">
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(50%-1rem)] bg-gray-50 rounded-2xl p-8 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <blockquote className="mb-6">
                  <p className="text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
                </blockquote>
                <div className="flex items-center gap-4">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    width={48}
                    height={48}
                    unoptimized={true}
                    className="rounded-full object-cover"
                    sizes="48px"
                    quality={85}
                  />
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full flex justify-center mt-8">
            {testimonials.slice(2).map((testimonial, index) => (
              <div
                key={index + 2}
                className="w-full sm:w-[calc(50%-1rem)] bg-gray-50 rounded-2xl p-8 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <blockquote className="mb-6">
                  <p className="text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
                </blockquote>
                <div className="flex items-center gap-4">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.author}
                    width={48}
                    height={48}
                    unoptimized={true}
                    className="rounded-full object-cover"
                    sizes="48px"
                    quality={85}
                  />
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout para desktop */}
        <div className="hidden lg:grid grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <blockquote className="mb-6">
                <p className="text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
              </blockquote>
              <div className="flex items-center gap-4">
                <Image
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  unoptimized={true}
                  className="rounded-full object-cover"
                  sizes="48px"
                  quality={85}
                />
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

