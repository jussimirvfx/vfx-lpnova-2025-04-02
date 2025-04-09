"use client"

import type React from "react"
import { Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { calculateLeadScore, scoreToMonetaryValue } from "@/lib/lead-scoring"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"
import { generateEventId } from "@/lib/meta-conversion-api"
import { formatPhoneNumber } from "@/lib/utils"

export function ContactModal() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    salesTeamSize: "",
    monthlyRevenue: "",
    segment: "",
    message: "",
    site: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    referrer: "",
    gclid: "",
    fbclid: "",
    fbc: "",
    fbp: "",
    phone: ""
  })
  const [countryCode, setCountryCode] = useState("+55")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Prefetch da página de agradecimento
    router.prefetch("/obrigado")

    // Ler o número do WhatsApp salvo
    const savedPhone = localStorage.getItem("whatsappNumber")
    if (savedPhone) {
      setPhoneNumber(savedPhone)
    }

    // Adicionar um event listener para o modal ser aberto
    const handleModalOpen = () => {
      const savedPhone = localStorage.getItem("whatsappNumber")
      if (savedPhone) {
        setPhoneNumber(savedPhone)
      }
    }

    const modal = document.getElementById("contactModal")
    if (modal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            if (modal.style.display === "flex") {
              handleModalOpen()
            }
          }
        })
      })

      observer.observe(modal, { attributes: true })
      return () => observer.disconnect()
    }
  }, [router])

  const closeModal = () => {
    const modal = document.getElementById("contactModal")
    if (modal) {
      modal.style.display = "none"
      document.body.style.overflow = "auto"
    }
  }

  // Modificar a função handleSubmit para incluir o lead scoring
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validações básicas
      if (!phoneNumber.trim()) {
        throw new Error("O número de telefone é obrigatório")
      }

      if (!formData.name.trim()) {
        throw new Error("O nome é obrigatório")
      }

      if (!formData.email.trim()) {
        throw new Error("O e-mail é obrigatório")
      }

      if (!formData.company.trim()) {
        throw new Error("O nome da empresa é obrigatório")
      }

      if (!formData.message.trim()) {
        throw new Error("A mensagem é obrigatória")
      }

      // Formatar número de telefone
      const cleanedPhone = phoneNumber.replace(/\D/g, "")
      const formattedPhone = cleanedPhone.startsWith(countryCode.replace("+", ""))
        ? `+${cleanedPhone}`
        : `${countryCode}${cleanedPhone}`

      // Calcular lead score
      const leadScoreResult = calculateLeadScore({
        segment: formData.segment,
        monthlyRevenue: formData.monthlyRevenue,
        salesTeamSize: formData.salesTeamSize,
      });

      // Verificar se o lead é qualificado
      if (!leadScoreResult.isQualified) {
        console.log("[Lead] Lead não qualificado:", {
          reason: leadScoreResult.reason,
          score: leadScoreResult.score,
          logDetails: leadScoreResult.logDetails,
          segment: formData.segment,
          monthlyRevenue: formData.monthlyRevenue,
          salesTeamSize: formData.salesTeamSize,
        });
      } else {
        console.log("[Lead] Lead qualificado:", {
          score: leadScoreResult.score,
          reason: leadScoreResult.reason,
          logDetails: leadScoreResult.logDetails,
          monetaryValue: scoreToMonetaryValue(leadScoreResult.score)
        });
      }

      // Preparar dados do lead
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formattedPhone,
        company: formData.company,
        segment: formData.segment,
        sales_team_size: formData.salesTeamSize || null,
        monthly_revenue: formData.monthlyRevenue || null,
        message: formData.message || null,
        site: formData.site || null,
        lead_score: leadScoreResult.score,
        qualified: leadScoreResult.isQualified,
        qualification_reason: leadScoreResult.reason,
        qualification_details: leadScoreResult.logDetails,
        utm_source: formData.utmSource,
        utm_medium: formData.utmMedium,
        utm_campaign: formData.utmCampaign,
        utm_term: formData.utmTerm,
        utm_content: formData.utmContent,
        referrer: formData.referrer,
        gclid: formData.gclid,
        fbclid: formData.fbclid,
        fbc: formData.fbc,
        fbp: formData.fbp,
        created_at: new Date().toISOString(),
        // Campos obrigatórios
        form_type: "formulario_reuniao_whatsapp",
        source: "Website",
        page_url: window.location.href
      };

      console.log("[ContactModal] Dados do lead antes do envio:", {
        sales_team_size: leadData.sales_team_size,
        monthly_revenue: leadData.monthly_revenue,
        message: leadData.message,
        formData: {
          salesTeamSize: formData.salesTeamSize,
          monthlyRevenue: formData.monthlyRevenue,
          message: formData.message
        }
      });

      // URL do webhook definida diretamente
      const webhookUrl =
        "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/f590fb28-1dd6-4aca-8164-89736275a973"

      // Log para validação
      console.log("[ContactModal] Enviando dados para API com webhook:", {
        webhookUrl: webhookUrl.substring(0, 30) + "...",
        form_type: "formulario_reuniao_whatsapp",
        phone: formattedPhone.substring(0, 5) + "..." // Mostrar apenas parte do número
      });

      // Enviar dados para a API PRIMEIRO e esperar a resposta
      try {
        const apiResponse = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...leadData,
            webhookUrl: webhookUrl,
          }),
        });
        
        const apiResult = await apiResponse.json();
        
        console.log("[ContactModal] Resposta da API recebida:", {
          success: apiResponse.ok,
          leadId: apiResult.leadId,
          savedToSupabase: apiResult.leadSaved
        });
        
        if (!apiResponse.ok) {
          console.error("[ContactModal] Erro na resposta da API:", apiResult);
          // Considerar se deve parar aqui ou continuar mesmo com erro na API
          // No momento, ele continua e redireciona
        } else {
           // Anteriormente enviávamos o evento Lead aqui, mas agora vamos apenas
           // armazenar os dados para serem usados na página de obrigado
           console.log("[ContactModal] API respondeu com sucesso, armazenando dados para lead na página de obrigado...");
           
           // Preparamos e salvamos os dados essenciais para o evento Lead
           const metaParams = getMetaParams(); // Pega fbc e fbp dos cookies
           const userData = prepareUserData({
             name: leadData.name,
             email: leadData.email,
             phone: formattedPhone,
             fbc: metaParams.fbc,
             fbp: metaParams.fbp
           });
           
           const leadEventData = {
             phone: formattedPhone,
             email: formData.email,
             name: formData.name,
             source: "Contact Modal",
             form_type: "formulario_contato_modal",
             page_url: window.location.href,
             fbc: metaParams.fbc,
             fbp: metaParams.fbp,
             qualified: leadScoreResult.isQualified,
             lead_score: leadScoreResult.score,
             value: leadScoreResult.isQualified ? scoreToMonetaryValue(leadScoreResult.score) : 0
           };
           
           // Salvar dados para uso na página de obrigado
           localStorage.setItem('pendingLeadEvent', JSON.stringify(leadEventData));
           console.log("[ContactModal] Dados de lead armazenados para processamento na página de obrigado");
           
           // Não enviamos mais o evento Lead aqui
           // window.sendMetaEvent("Lead", eventData, { eventID: eventId });
        }

      } catch (apiError) {
        console.error("[ContactModal] Erro ao enviar para API:", apiError);
        // Não interromper o fluxo do usuário mesmo com erro na API
      } finally {
        setIsSubmitting(false); // Liberar o botão de envio em caso de sucesso ou erro
      }

      // Limpar formulário e redirecionar APENAS se não houve erro crítico 
      // (atualmente redireciona mesmo com erro na API, podemos ajustar se necessário)
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        segment: "",
        salesTeamSize: "",
        monthlyRevenue: "",
        message: "",
        site: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
        referrer: "",
        gclid: "",
        fbclid: "",
        fbc: "",
        fbp: "",
      });

      // Redirecionar para a página de agradecimento
      window.location.href = "/obrigado";
    } catch (error) {
      console.error("Erro ao enviar formulário:", {
        error,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        formData: {
          ...formData,
          phone: "REDACTED",
        },
      })

      setError(
        error instanceof Error ? error.message : "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
      )

      // Scroll to error message
      const errorElement = document.querySelector(".error-message")
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Previne o scroll do body quando o modal está aberto
  useEffect(() => {
    const handleModalOpen = () => {
      document.body.style.overflow = "hidden"
    }

    const modal = document.getElementById("contactModal")
    if (modal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            if (modal.style.display === "flex") {
              handleModalOpen()
            }
          }
        })
      })

      observer.observe(modal, { attributes: true })

      return () => observer.disconnect()
    }
  }, [])

  // Criar um handler específico para o campo de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aplicar a formatação enquanto o usuário digita
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  return (
    <div
      id="contactModal"
      className="fixed inset-0 bg-black/50 z-50 hidden items-start sm:items-center justify-center overflow-y-auto"
    >
      <div className="relative bg-white w-[95%] sm:w-[90%] max-w-[500px] rounded-lg shadow-lg my-4">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10" onClick={closeModal}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-xl font-bold">Agende sua reunião gratuita</h3>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="space-y-3 mb-6">
            {["Reunião via videochamada", "Diagnóstico gratuito do seu marketing", "Atendimento em até 24 horas"].map(
              (benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#4CAF50]" />
                  <span>{benefit}</span>
                </div>
              ),
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Nome completo"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-32 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="+55">🇧🇷 Brasil</option>
                <option value="+351">🇵🇹 Portugal</option>
                <option value="+1">🇺🇸 EUA</option>
              </select>
              <input
                type="tel"
                placeholder="WhatsApp"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <input
              type="text"
              name="company"
              placeholder="Empresa"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <input
              type="text"
              name="site"
              placeholder="Informe o Instagram ou site de sua empresa..."
              value={formData.site}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <select
              name="salesTeamSize"
              value={formData.salesTeamSize}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled>
                Quantidade de vendedores
              </option>
              <option value="somente-dono">Somente o dono da empresa</option>
              <option value="1-3">1 a 3 vendedores</option>
              <option value="4-10">4 a 10 vendedores</option>
              <option value="11-20">11 a 20 vendedores</option>
              <option value="20+">Mais de 20 vendedores</option>
            </select>
            <select
              name="monthlyRevenue"
              value={formData.monthlyRevenue}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled>
                Faturamento mensal da empresa
              </option>
              <option value="ate-10k">Até R$ 10 mil</option>
              <option value="11k-50k">De R$ 11 mil a R$ 50 mil</option>
              <option value="51k-100k">De R$ 51 mil a R$ 100 mil</option>
              <option value="101k-400k">De R$ 101 mil a R$ 400 mil</option>
              <option value="401k-1m">De R$ 401 mil a R$ 1 milhão</option>
              <option value="1m+">Acima de R$ 1 milhão</option>
            </select>
            <select
              name="segment"
              value={formData.segment}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled>
                Segmento da empresa
              </option>
              <option value="freelancer-marketing">Freelancer / Marketing / Publicidade</option>
              <option value="ecommerce">E-commerce / Dropshipping</option>
              <option value="infoproduto">Infoproduto / Lançamento / Afiliado / Encapsulados</option>
              <option value="varejo">Varejo / Comércio Local</option>
              <option value="food-service">Food Service / Delivery / Restaurantes</option>
              <option value="industria">Indústria / Manufatura</option>
              <option value="agro">Agro / Agroindústria</option>
              <option value="educacao">Educação</option>
              <option value="saas">SAAS / Software / Apps</option>
              <option value="startups">Startups</option>
              <option value="financas">Finanças</option>
              <option value="franquia">Franquia</option>
              <option value="telecom">Telecom</option>
              <option value="energia-solar">Energia Solar</option>
              <option value="turismo">Turismo</option>
              <option value="imobiliaria">Imobiliária</option>
              <option value="outro">Outro</option>
            </select>
            <textarea
              name="message"
              placeholder="Como podemos ajudar você?"
              value={formData.message}
              onChange={handleChange}
              required
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
               w-full py-3 rounded-lg font-semibold transition-all relative
               ${
                 isSubmitting
                   ? "bg-[#48ce34] cursor-not-allowed opacity-75"
                   : "bg-[#48ce34] hover:bg-[#3db82c] shadow-[0_8px_30px_rgb(72,206,52,0.3)] hover:shadow-[0_8px_40px_rgb(72,206,52,0.45)] hover:translate-y-[-1px]"
               }
               text-white
             `}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">ENVIAR</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                "ENVIAR"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Seus dados estão seguros e não serão compartilhados com terceiros.
          </p>
        </div>
      </div>
    </div>
  )
}

