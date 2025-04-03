import { Facebook, Instagram, Linkedin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-4">VFX</h3>
            <p className="text-gray-400 mb-6">
              Agência especializada em videomarketing e marketing digital para empresas que buscam resultados
              mensuráveis.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://www.facebook.com/agencia.vfx/"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.instagram.com/agencia.vfx/"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/agencia-vfx/"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Serviços</h3>
            <ul className="space-y-3">
              {[
                "Videomarketing",
                "Marketing Digital",
                "Gestão de Tráfego",
                "Desenvolvimento Web",
                "Assessoria Comercial",
              ].map((service) => (
                <li key={service}>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="mailto:contato@agenciavfx.com.br"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  contato@agenciavfx.com.br
                </Link>
              </li>
              <li className="text-gray-400">Santa Catarina</li>
              <li className="text-gray-400 text-sm">CNPJ: 19.628.811/0001-60</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          &copy; {new Date().getFullYear()} Agência VFX. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}

