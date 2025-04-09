"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPhoneNumber } from "@/lib/utils"
import { calculateLeadScore, scoreToMonetaryValue } from "@/lib/lead-scoring"
import { Check, PlayCircle } from "lucide-react"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"
import { generateEventId } from "@/lib/meta-conversion-api"
import { sendGA4Event, sendMeasurementProtocolEvent } from "@/lib/ga4/events"

// Schema de validação do formulário
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(14, "Telefone inválido"),
  company: z.string().min(2, "Empresa é obrigatória"),
  site: z.string().optional(),
  salesTeamSize: z.string().min(1, "Selecione a quantidade de vendedores"),
  monthlyRevenue: z.string().min(1, "Selecione o faturamento mensal"),
  segment: z.string().min(1, "Selecione o segmento da empresa"),
  message: z.string().min(3, "Mensagem é obrigatória")
})

type FormData = z.infer<typeof formSchema>

export function PresentationModal() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState("+55")
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Formatar número de telefone
      const cleanedPhone = data.phone.replace(/\D/g, "")
      const formattedPhone = cleanedPhone.startsWith(countryCode.replace("+", ""))
        ? `+${cleanedPhone}`
        : `${countryCode}${cleanedPhone}`

      // Calcular lead score
      const leadScoreResult = calculateLeadScore({
        segment: data.segment,
        monthlyRevenue: data.monthlyRevenue,
        salesTeamSize: data.salesTeamSize,
      });

      // Verificar se o lead é qualificado
      if (!leadScoreResult.isQualified) {
        console.log("[Lead] Lead não qualificado:", {
          reason: leadScoreResult.reason,
          score: leadScoreResult.score,
          logDetails: leadScoreResult.logDetails,
          segment: data.segment,
          monthlyRevenue: data.monthlyRevenue,
          salesTeamSize: data.salesTeamSize,
        });
      } else {
        console.log("[Lead] Lead qualificado:", {
          score: leadScoreResult.score,
          reason: leadScoreResult.reason,
          logDetails: leadScoreResult.logDetails,
          monetaryValue: scoreToMonetaryValue(leadScoreResult.score)
        });
      }

      // Preparar os parâmetros meta
      const metaParams = getMetaParams();
      const metaEventId = generateEventId();

      // Preparar dados do usuário com telefone hasheado para Meta
      const metaUserData = prepareUserData({
        name: data.name,
        email: data.email,
        phone: formattedPhone,
        fbc: metaParams.fbc,
        fbp: metaParams.fbp
      });

      if (typeof window !== "undefined" && window.sendMetaEvent) {
        // Disparar evento de Contact (sempre dispara, independente do score)
        window.sendMetaEvent(
          "Contact",
          {
            content_name: "Presentation Modal Form",
            content_category: "WhatsApp Submission",
          },
          {
            user_data: metaUserData,
            eventID: metaEventId,
          },
        );
        console.log("[PresentationModal] Evento 'Contact' Meta enviado com ID:", metaEventId);
      } else {
        console.warn('[PresentationModal] window.sendMetaEvent not defined, event not sent.');
      }

      // --- Envio GA4 (novo) ---
      const ga4EventParams = {
          item_name: "Presentation Modal Form",
          item_category: "Form Submission",
          form_status: "submitted"
      };

      // Enviar evento GA4 via gtag (cliente)
      const uniqueIdentifier = data.email || formattedPhone;
      sendGA4Event('Whatsapp', ga4EventParams, `presentation_${uniqueIdentifier}`);

      // Preparar dados para Measurement Protocol
      const ga4MpEventData = {
          user_properties: {
          },
          events: [{
              name: 'Whatsapp',
              params: {
                  ...ga4EventParams,
              }
          }]
      };

      // Enviar evento GA4 via Measurement Protocol (servidor)
      sendMeasurementProtocolEvent(ga4MpEventData);

      // --- Fim Envio GA4 ---

      // Preparar dados do lead
      const leadData = {
        name: data.name,
        email: data.email,
        phone: formattedPhone,
        company: data.company,
        segment: data.segment,
        sales_team_size: data.salesTeamSize,
        monthly_revenue: data.monthlyRevenue,
        message: data.message,
        site: data.site || null,
        lead_score: leadScoreResult.score,
        qualified: leadScoreResult.isQualified,
        qualification_reason: leadScoreResult.reason,
        qualification_details: leadScoreResult.logDetails,
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
        referrer: document.referrer,
        gclid: "",
        fbclid: "",
        fbc: metaParams.fbc || "",
        fbp: metaParams.fbp || "",
        created_at: new Date().toISOString(),
        form_type: "formulario_apresentacao",
        source: "Website",
        page_url: window.location.href
      };

      console.log("[PresentationModal] Dados do lead antes do envio:", {
        sales_team_size: leadData.sales_team_size,
        monthly_revenue: leadData.monthly_revenue,
        message: leadData.message,
      });

      // URL do webhook definida diretamente
      const webhookUrl =
        "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/f590fb28-1dd6-4aca-8164-89736275a973"

      // Log para validação
      console.log("[PresentationModal] Enviando dados para API com webhook:", {
        webhookUrl: webhookUrl.substring(0, 30) + "...",
        form_type: "formulario_apresentacao",
        phone: formattedPhone.substring(0, 5) + "..." // Mostrar apenas parte do número
      });

      // Enviar dados para a API e esperar a resposta
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
        
        console.log("[PresentationModal] Resposta da API recebida:", {
          success: apiResponse.ok,
          leadId: apiResult.leadId,
          savedToSupabase: apiResult.leadSaved
        });
        
        if (!apiResponse.ok) {
          console.error("[PresentationModal] Erro na resposta da API:", apiResult);
        } else {
           // Armazenar os dados para serem usados na página de apresentação
           console.log("[PresentationModal] API respondeu com sucesso, armazenando dados para a página de apresentação...");
           
           // Preparar dados para o evento Lead (será processado na página /apresentacao)
           const leadEventData = {
             phone: formattedPhone,
             email: data.email,
             name: data.name,
             source: "Presentation Form",
             form_type: "formulario_apresentacao",
             page_url: window.location.href,
             fbc: metaParams.fbc,
             fbp: metaParams.fbp,
             lead_score: leadScoreResult.score,
             qualified: leadScoreResult.isQualified,
             value: leadScoreResult.isQualified ? scoreToMonetaryValue(leadScoreResult.score) : 0
           };
           
           // Salvar dados para uso na página de apresentação
           localStorage.setItem('pendingLeadEvent', JSON.stringify(leadEventData));
           console.log("[PresentationModal] Dados de lead armazenados para processamento na página de apresentação");
        }

      } catch (apiError) {
        console.error("[PresentationModal] Erro ao enviar para API:", apiError);
        // Não interromper o fluxo do usuário mesmo com erro na API
      }

      // Fechar modal e resetar form imediatamente
      if (typeof document !== 'undefined') {
        const modal = document.getElementById("presentationModal")
        if (modal) {
          modal.style.display = "none"
          document.body.style.overflow = "auto"
        }
      }

      // Redirecionar imediatamente
      if (typeof window !== 'undefined') {
        window.location.href = "/apresentacao"
      }
    } catch (error) {
      console.error("[PresentationModal] Erro ao enviar formulário:", error)
      setError(
        error instanceof Error ? error.message : "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhoneNumber(e.target.value)
  }

  return (
    <div
      id="presentationModal"
      className="fixed inset-0 z-50 hidden items-start sm:items-center justify-center bg-black/50 overflow-y-auto"
    >
      <div className="relative w-[95%] sm:w-[90%] max-w-[500px] rounded-lg bg-white shadow-lg my-4">
        <button
          onClick={() => {
            if (typeof document !== 'undefined') {
              const modal = document.getElementById("presentationModal")
              if (modal) {
                modal.style.display = "none"
                document.body.style.overflow = "auto"
              }
            }
          }}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-xl font-bold">Assista nossa apresentação exclusiva</h2>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="space-y-3 mb-6">
            {["Vídeo exclusivo sobre nossa metodologia", "Cases de sucesso detalhados", "Resultados comprovados"].map(
              (benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#4CAF50]" />
                  <span>{benefit}</span>
                </div>
              ),
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#f5f7fa] rounded-full flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-primary" />
            </div>
            <p className="text-gray-600">
              Preencha seus dados para receber o link da apresentação diretamente no seu WhatsApp
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <input
              type="text"
              {...register("name")}
              placeholder="Nome completo"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {errors.name && (
              <span className="text-sm text-red-500">{errors.name.message}</span>
            )}

            <input
              type="email"
              {...register("email")}
              placeholder="E-mail"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            )}

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
                {...register("phone")}
                placeholder="WhatsApp"
                onChange={handlePhoneChange}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            {errors.phone && (
              <span className="text-sm text-red-500">{errors.phone.message}</span>
            )}

            <input
              type="text"
              {...register("company")}
              placeholder="Empresa"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {errors.company && (
              <span className="text-sm text-red-500">{errors.company.message}</span>
            )}

            <input
              type="text"
              {...register("site")}
              placeholder="Informe o Instagram ou site de sua empresa..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />

            <select
              {...register("salesTeamSize")}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled selected>Quantidade de vendedores</option>
              <option value="somente-dono">Somente o dono da empresa</option>
              <option value="1-3">1 a 3 vendedores</option>
              <option value="4-10">4 a 10 vendedores</option>
              <option value="11-20">11 a 20 vendedores</option>
              <option value="20+">Mais de 20 vendedores</option>
            </select>
            {errors.salesTeamSize && (
              <span className="text-sm text-red-500">{errors.salesTeamSize.message}</span>
            )}

            <select
              {...register("monthlyRevenue")}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled selected>Faturamento mensal da empresa</option>
              <option value="ate-10k">Até R$ 10 mil</option>
              <option value="11k-50k">De R$ 11 mil a R$ 50 mil</option>
              <option value="51k-100k">De R$ 51 mil a R$ 100 mil</option>
              <option value="101k-400k">De R$ 101 mil a R$ 400 mil</option>
              <option value="401k-1m">De R$ 401 mil a R$ 1 milhão</option>
              <option value="1m+">Acima de R$ 1 milhão</option>
            </select>
            {errors.monthlyRevenue && (
              <span className="text-sm text-red-500">{errors.monthlyRevenue.message}</span>
            )}

            <select
              {...register("segment")}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="" disabled selected>Segmento da empresa</option>
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
            {errors.segment && (
              <span className="text-sm text-red-500">{errors.segment.message}</span>
            )}

            <textarea
              {...register("message")}
              placeholder="Como podemos ajudar você?"
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {errors.message && (
              <span className="text-sm text-red-500">{errors.message.message}</span>
            )}

            <Button
              type="submit"
              className="w-full bg-primary font-semibold text-white hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Assistir apresentação</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                "Assistir apresentação"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Seus dados estão seguros e não serão compartilhados com terceiros.
          </p>
        </div>
      </div>
    </div>
  )
}

