"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PhoneIcon as WhatsappIcon, ArrowRight } from "lucide-react"
import { generateEventId } from "@/lib/meta-conversion-api"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"

export function WhatsAppForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Adicionar useEffect para ler o número do WhatsApp salvo
  useEffect(() => {
    const savedPhone = localStorage.getItem("whatsappNumber")
    if (savedPhone) {
      setPhoneNumber(savedPhone)
    }

    // Verificar o status do Supabase ao carregar o componente
    fetch("/api/debug")
      .then((response) => response.json())
      .then((data) => {
        console.log("[WhatsAppForm] Debug info:", data)
        setDebugInfo(data)
      })
      .catch((error) => {
        console.error("[WhatsAppForm] Erro ao buscar debug info:", error)
      })
  }, [])

  // Modificar a função handleSubmit para incluir o lead scoring
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Log inicial para rastrear o início do processo
      console.log("[WhatsAppForm] Iniciando envio de formulário", {
        timestamp: new Date().toISOString(),
        phoneLength: phoneNumber.length,
      })

      // Formatar número removendo todos os caracteres não numéricos
      const cleanedNumber = phoneNumber.replace(/\D/g, "")

      // Validar número
      if (cleanedNumber.length < 10 || cleanedNumber.length > 13) {
        console.error("[WhatsAppForm] Número de telefone inválido", {
          raw: phoneNumber,
          cleaned: cleanedNumber,
          length: cleanedNumber.length,
        })
        throw new Error("Por favor, digite um número de WhatsApp válido")
      }

      // Adicionar código do país (55) se não estiver presente
      const formattedNumber = cleanedNumber.startsWith("55") ? cleanedNumber : `55${cleanedNumber}`

      console.log("[WhatsAppForm] Número formatado com sucesso", {
        rawNumber: phoneNumber,
        cleanedNumber,
        formattedNumber,
        timestamp: new Date().toISOString(),
      })

      // Salvar o número no localStorage para uso em outros formulários
      localStorage.setItem("whatsappNumber", phoneNumber)

      // Preparar dados do lead para scoring e tracking
      const leadData = {
        phone: `+${formattedNumber}`,
        source: "WhatsApp Form",
        form_type: "formulario_whatsapp",
        page_url: window.location.href,
        fbc: getMetaParams().fbc,
        fbp: getMetaParams().fbp,
        email: null,
        name: null,
      }

      // Track Facebook Pixel event com lead scoring
      if (typeof window !== "undefined") {
        // Verificar se a função global está disponível
        if (window.sendMetaEvent) {
          // Gerar um ID de evento único para deduplicação entre pixel e API
          const eventId = generateEventId();
          
          // Obter parâmetros do Meta
          const metaParams = getMetaParams();
          
          // Preparar dados do usuário com telefone hasheado
          const userData = prepareUserData({
            phone: formattedNumber,
            fbc: metaParams.fbc,
            fbp: metaParams.fbp
          });
          
          // Disparar evento de Contact (sempre dispara, independente do score)
          window.sendMetaEvent("Contact", {
            content_name: "WhatsApp Form",
            content_category: "WhatsApp Submission",
          }, { 
            user_data: userData,
            eventID: eventId 
          });

          console.log("[WhatsAppForm] Evento 'Contact' enviado via Meta Pixel e Conversão API com ID: " + eventId);
          console.log("[WhatsAppForm] Dados do usuário:", {
            phone: formattedNumber.substring(0, 4) + "***",
            hasFbc: !!metaParams.fbc,
            hasFbp: !!metaParams.fbp,
            hasPhoneHash: !!userData.ph?.[0],
            phoneHash: userData.ph?.[0]?.substring(0, 8) + "..."
          });
        } else {
          // Fallback para importação dinâmica se a função global não estiver disponível
          const { trackPixelEvent } = await import("@/lib/facebook-pixel-init");
          trackPixelEvent("Contact", {
            content_name: "WhatsApp Form",
            content_category: "WhatsApp Submission",
            user_data: prepareUserData({ phone: formattedNumber })
          });
        }
      }

      // Open contact modal immediately - MOVIDO PARA ANTES DO ENVIO DE DADOS
      const modal = document.getElementById("contactModal")
      if (modal) {
        modal.style.display = "flex"
        console.log("[WhatsAppForm] Modal de contato aberto")
      }

      // URL do webhook definida diretamente
      const webhookUrl =
        "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/de710246-9116-4dcd-8712-98207717104c"

      // Capturar a URL atual da página
      const currentPageUrl = window.location.href

      console.log("[WhatsAppForm] Enviando dados para API", {
        endpoint: "/api/leads",
        leadData: {
          ...leadData,
          phone: "REDACTED", // Redact phone for privacy in logs
        },
        hasWebhookUrl: !!webhookUrl,
        debugInfo: debugInfo
          ? {
              hasSupabaseUrl: debugInfo.environment?.hasSupabaseUrl,
              hasSupabaseKey: debugInfo.environment?.hasSupabaseKey,
              connectionSuccess: debugInfo.connection?.success,
            }
          : null,
      })

      // Use the API endpoint that handles both webhook and Supabase
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...leadData,
          webhookUrl: webhookUrl,
        }),
      })

      console.log("[WhatsAppForm] Resposta da API recebida", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      })

      const responseData = await response.json()
      console.log("[WhatsAppForm] Dados da resposta da API", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao processar lead")
      }

      // Reset form
      setPhoneNumber("")
    } catch (error) {
      console.error("[WhatsAppForm] Erro no processamento do formulário:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })
      alert(
        error instanceof Error ? error.message : "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "")

    if (phoneNumber.length <= 2) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`
    } else {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col lg:flex-row gap-2"
      style={{ minHeight: "48px" }} // Altura mínima fixa para evitar layout shift
    >
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <WhatsappIcon className="w-5 h-5" />
        </div>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
          placeholder="Digite aqui seu WhatsApp..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg lg:rounded-r-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
          maxLength={15}
          required
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
         px-8 py-3 rounded-lg lg:rounded-l-none font-semibold whitespace-nowrap 
         inline-flex items-center justify-center gap-2
         transition-all
         ${
           isSubmitting
             ? "bg-gray-400 cursor-not-allowed"
             : "bg-[#48ce34] hover:bg-[#3db82c] shadow-[0_8px_30px_rgb(72,206,52,0.3)] hover:shadow-[0_8px_40px_rgb(72,206,52,0.45)] hover:translate-y-[-1px]"
         }
         text-white
       `}
      >
        {isSubmitting ? (
          "Enviando..."
        ) : (
          <>
            Agendar Reunião
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  )
}

