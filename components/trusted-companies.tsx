import Image from "next/image"

export function TrustedCompanies() {
  const companies = [
    {
      name: "Chilli Beans",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chilli-240px-01-idcroJeV3V6KPYGzfRXjRUz3G0guJP.webp",
    },
    {
      name: "CyberArk",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cyberark-240px-01-7lE1TqwP01sWmiMqRsFBhwcI6oeo9p.webp",
    },
    {
      name: "Ambev",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ambev-240px-1-Xh0WDjaRI2NxbrtIv6TOMr5EMEEnMV.webp",
    },
    {
      name: "Gerdau",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gerdau-240px-01-pNVtVw1io0coJWWJD6e6ITe6CoR2kv.webp",
    },
    {
      name: "Unicred",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unicred-240px-01-8ghUU82iYaHz1Ei9gaayhWBeJHKCqg.webp",
    },
    {
      name: "Campari",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/campari-240px-01-msODRvMRQvmmG4kTHrPSQvvzjSctA1.webp",
    },
    {
      name: "Dupont",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dupont-240px-01-MB7yJgn7drQruIB6jW9oNqB9CFwgAl.webp",
    },
    {
      name: "Senior",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/senior-240px-01-C82OvJnCcLvGLB9F8bnwC88k5Gc8JL.webp",
    },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="container px-6 mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-xl sm:text-2xl text-gray-900 font-medium">
            Alguns clientes que confiam no trabalho da VFX:
          </h3>
        </div>

        {/* Grid de logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-12 max-w-7xl mx-auto">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center justify-center">
              <div className="relative w-[184px] h-[61px] sm:w-[207px] sm:h-[69px]">
                <Image
                  src={company.logo || "/placeholder.svg"}
                  alt={`Logo ${company.name}`}
                  fill
                  unoptimized={true}
                  className="object-contain filter grayscale opacity-75 hover:filter-none hover:opacity-100 transition-all duration-300"
                  sizes="(max-width: 640px) 160px, 180px"
                  width={240}
                  height={80}
                  quality={85}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

