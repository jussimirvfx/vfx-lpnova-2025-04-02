import type { Metadata, Viewport } from "next"
import { ThankYouVideo } from "@/components/thank-you-video"
import { Facebook, Instagram, Linkedin } from "lucide-react"
import Link from "next/link"
import ClientPageView from "./page-view-client"
import LeadTracker from "./lead-tracker"
import SubmitApplicationTracker from "@/app/obrigado/submit-application-tracker"

export const viewport: Viewport = {
  themeColor: "#187eff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: "Apresentação da VFX Agência - Soluções em Marketing Digital",
  description: "Conheça nossa agência e como podemos ajudar seu negócio a crescer com marketing digital estratégico.",
}

export default function PresentationThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Componentes para rastreamento de analytics */}
      <ClientPageView />
      <LeadTracker />
      <SubmitApplicationTracker />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 18839 6776"
              className="h-12 w-auto"
              aria-label="Logo VFX Agência"
            >
              <defs>
                <linearGradient
                  id="header-logo-gradient"
                  x1="5436"
                  x2="219"
                  y1="3746"
                  y2="3746"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#17b2ff" />
                  <stop offset="1" stopColor="#3d84ff" />
                </linearGradient>
              </defs>
              <path d="M6514 2994a790 790 0 01-327-63 488 488 0 01-215-180c-50-78-76-169-76-273s22-187 66-266c44-78 112-143 205-196s210-90 350-113l589-96v330l-506 87c-86 15-150 43-192 83-42 40-63 91-63 155s24 110 72 147a282 282 0 00176 55c90 0 170-20 240-58 70-39 124-92 162-160a450 450 0 0058-225v-463c0-77-30-142-90-194a362 362 0 00-240-77 431 431 0 00-403 271l-355-172c36-95 91-177 167-247s166-124 270-163c103-40 216-60 337-60 148 0 278 27 390 81a595 595 0 01357 560v1197h-410v-307l93-7a697 697 0 01-384 312 845 845 0 01-270 42ZM8760 3682c-135 0-260-22-374-66a890 890 0 01-296-184 697 697 0 01-180-276l403-152a375 375 0 00157 203 512 512 0 00290 78c88 0 165-16 233-50 67-33 120-80 157-143a434 434 0 0056-227v-410l83 100a615 615 0 01-248 244 742 742 0 01-354 83 875 875 0 01-450-116 826 826 0 01-310-317c-75-135-113-286-113-453s38-320 113-453a828 828 0 01307-313 861 861 0 01443-114c134 0 253 28 355 85a710 710 0 01257 243l-60 109v-397h410v1710a783 783 0 01-425 710 945 945 0 01-454 106Zm-20-1200a470 470 0 00243-62c70-40 124-97 163-170 40-72 60-156 60-250s-20-177-61-250a460 460 0 00-165-174c-70-42-150-63-240-63s-172 21-245 63c-73 42-130 100-170 173-40 74-61 157-61 250s20 175 61 248c40 73 97 130 169 172a479 479 0 00246 63Zm2155 512a922 922 0 01-486-125 875 875 0 01-324-341c-77-143-115-302-115-476s39-341 117-481a865 865 0 01775-455 930 930 0 01372 70 793 793 0 01273 192 860 860 0 01172 279 948 948 0 0154 435c-3 33-10 61-18 86h-1388v-331H11470l-205 155c20-100 15-191-14-270a389 389 0 00-389-258c-95 0-170 22-241 67a419 419 0 00-160 199c-37 87-50 192-42 315a580 580 0 0045 293c38 85 96 150 172 197 76 46 163 69 262 69s184-20 253-63c70-42 124-98 164-168l350 171c-35 86-90 162-165 229a828 828 0 01-266 155 980 980 0 01-339 56ZM10210 840l387-546h512l390 546h-430l-215-300-214 300h-430Zm1855 2115V1156h406V1510l-33-63a470 470 0 01207-246c96-56 207-85 335-85s250 30 352 86a612 612 0 01240 240 716 716 0 0186 356v1156h-433V1900c0-80-16-148-47-205a340 340 0 00-317-182 360 360 0 00-188 48 335 335 0 00-130 134c-30 57-46 126-46 205v1055h-433Zm2826 40A939 939 0 0114410 2870a903 903 0 01-336-337c-81-142-122-303-122-481s40-338 122-480A896 896 0 0114410 1240a950 950 0 01480-123 932 932 0 01644 253c80 79 138 172 173 280l-380 165a450 450 0 00-436-300 466 466 0 00-427 260c-41 82-62 175-62 281s20 200 62 281a466 466 0 00426 261 454 454 0 00437-304l380 172a724 724 0 01-171 273c-80 80-174 143-285 188-110 45-230 68-360 68Zm1144-2040V492h433v462h-433Zm0 2000V1156h433v1799h-433Zm1378 40a790 790 0 01-327-63 488 488 0 01-215-180c-50-78-76-169-76-273s22-187 66-266a528 528 0 01205-196c93-53 210-90 350-113l589-96v330l-506 87a370 370 0 00-192 83c-42 40-62 91-62 155s23 110 70 147a282 282 0 00178 55c90 0 170-20 240-58a413 413 0 00161-160 450 450 0 0058-225v-463c0-77-30-142-90-194a362 362 0 00-240-77a430 430 0 00-403 271l-354-172c35-95 90-177 166-247s166-124 270-163a930 930 0 01337-60c148 0 278 27 390 81a598 598 0 01357 560v1197h-410v-307l93-7a697 697 0 01-383 312 845 845 0 01-272 42Zm-10902 3360-708-1798h473L6790 5971h-176L7130 4556h473l-708 1799h-383Zm1537 0v-1410h-317v-388h317v-60a680 680 0 0184-348 554 554 0 01237-220 797 797 0 01448-70l80 10v375a468 468 0 00-112-10c-97 0-172 21-225 64-53 43-79 110-79 200v60h400v386h-400v1412h-433Zm972 0 628-902-631-896h509l492 728H9790l493-728h506l-629 896 625 903H10280L9793 5630h222l-486 724h-510Z" />
              <path
                d="M2828 1138A2609 2609 0 00685 5235v-1a200 200 0 017 166l-324 806 830-330c39-15 83-13 121 5l33 16a2609 2609 0 101476-4760Z"
                fill="url(#header-logo-gradient)"
              />
              <path d="M2228 2816v1923L3840 3778l-1612-962" fill="#fff" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Agradecemos seu interesse!</h1>
          <p className="text-gray-600 text-lg">
            Em breve você receberá o link da nossa apresentação no seu WhatsApp. Mas se preferir, você já pode assistir
            agora mesmo abaixo.
          </p>
        </div>

        {/* Video and Steps Section - Updated layout for horizontal video */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Assista nossa apresentação:</h2>
            <ThankYouVideo />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Próximos passos:</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Aguarde nossa mensagem",
                  description:
                    "Em até 5 minutos, você receberá o link da apresentação no seu WhatsApp para assistir quando quiser.",
                  icon: "📱",
                },
                {
                  title: "Compartilhe com sua equipe",
                  description:
                    "Envie o link da apresentação para as pessoas-chave da sua empresa que também precisam conhecer nossa metodologia.",
                  icon: "👥",
                },
                {
                  title: "Agende uma reunião",
                  description:
                    "Após assistir à apresentação, agende uma reunião gratuita conosco para discutirmos seu projeto.",
                  icon: "📅",
                },
                {
                  title: "Conheça mais sobre nós",
                  description: "Siga-nos nas redes sociais para ficar por dentro das novidades e cases de sucesso.",
                  icon: "🚀",
                },
              ].map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 text-2xl flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media */}
            <div className="mt-8 pt-6 border-t">
              <p className="text-gray-600 mb-4 text-center">Siga a VFX nas redes sociais:</p>
              <div className="flex justify-center gap-4">
                <a
                  href="https://www.facebook.com/agencia.vfx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1877f2] text-white p-3 rounded-full hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="sr-only">Seguir no Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/agencia.vfx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#e4405f] text-white p-3 rounded-full hover:opacity-90 transition-opacity"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="sr-only">Seguir no Instagram</span>
                </a>
                <a
                  href="https://www.linkedin.com/company/agencia-vfx/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0a66c2] text-white p-3 rounded-full hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="sr-only">Seguir no LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

