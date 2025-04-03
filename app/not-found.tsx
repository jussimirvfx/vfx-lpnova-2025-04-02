import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Página não encontrada - VFX Agência",
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="mb-4">Página não encontrada</p>
        <Link href="/" className="text-primary hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  )
}

