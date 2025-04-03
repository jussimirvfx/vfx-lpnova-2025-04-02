"use client"

import type React from "react"

import { PhoneIcon as WhatsappIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { generateEventId, normalizeAndHashPhone, getFbc, getFbp } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"

export function BottomWhatsAppForm() {
  const [phoneNumber, setPhoneNumber] = useState("")

  // Adicionar este useEffect para ler o número do WhatsApp salvo
  useEffect(() => {
    const savedPhone = localStorage.getItem("whatsappNumber")
    if (savedPhone) {
      setPhoneNumber(savedPhone)
    }
  }, [])

  const openModal = async (number: string) => {
    // Verificar se o evento já foi enviado recentemente
    const formIdentifier = `contact_whatsapp_${number}`;
    if (isEventAlreadySent("Contact", formIdentifier)) {
      console.log("[BottomWhatsAppForm] Evento Contact já enviado recentemente, ignorando duplicação");
      // Abrir o modal mesmo assim
      const modal = document.getElementById("contactModal")
      if (modal) {
        localStorage.setItem("whatsappNumber", number)
        modal.style.display = "flex"
      }
      return;
    }
    
    // Normalizar o número antes do processamento
    const cleanedNumber = number.replace(/\D/g, "")
    const countryCode = "55" // Brasil
    
    // Garantir que o número tenha o código do país
    const normalizedNumber = cleanedNumber.startsWith(countryCode) 
      ? cleanedNumber 
      : `${countryCode}${cleanedNumber}`
    
    // Verificar se o número é válido
    if (normalizedNumber.length < 12) {
      console.warn("[BottomWhatsAppForm] Número inválido para rastreamento:", normalizedNumber);
    }
    
    // Criar hash do telefone seguindo as diretrizes do Meta
    const phoneHash = normalizeAndHashPhone(normalizedNumber)
    
    // Obter FBC e FBP para envio nos eventos
    const fbc = getFbc()
    const fbp = getFbp()
    
    // Registrar fbc e fbp para debug
    console.log("[BottomWhatsAppForm] FBC e FBP para rastreamento:", {
      hasFbc: !!fbc,
      fbcSample: fbc ? fbc.substring(0, 12) + "..." : "não encontrado",
      hasFbp: !!fbp,
      fbpSample: fbp ? fbp.substring(0, 12) + "..." : "não encontrado"
    });
    
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
          phone: normalizedNumber,
          fbc: metaParams.fbc,
          fbp: metaParams.fbp
        });
        
        // Disparar evento de Contact
        window.sendMetaEvent(
          "Contact",
          {
            content_name: "Bottom WhatsApp Form",
            content_category: "WhatsApp Submission",
          },
          {
            user_data: userData,
            eventID: eventId,
          },
        );
        
        console.log("[BottomWhatsAppForm] Evento 'Contact' enviado via Meta Pixel e Conversão API com ID: " + eventId);
        console.log("[BottomWhatsAppForm] Dados do usuário:", {
          phone: normalizedNumber.substring(0, 4) + "***",
          hasFbc: !!metaParams.fbc,
          hasFbp: !!metaParams.fbp,
          hasPhoneHash: !!userData.ph?.[0],
          phoneHash: userData.ph?.[0]?.substring(0, 8) + "..."
        });
      } else {
        // Fallback para importação dinâmica se a função global não estiver disponível
        const { trackPixelEvent } = await import("@/lib/facebook-pixel-init");
        trackPixelEvent("Contact", {
          content_name: "Bottom WhatsApp Form",
          content_category: "WhatsApp Submission",
          user_data: prepareUserData({ phone: normalizedNumber })
        });
      }
    }

    // Enviar dados para API antes de abrir o modal
    try {
      // Formatar corretamente o número para a API
      const formattedNumber = normalizedNumber.startsWith("55") ? `+${normalizedNumber}` : `+55${normalizedNumber}`;
      
      // Preparar dados do lead
      const leadData = {
        phone: formattedNumber,
        source: "Bottom WhatsApp Form",
        form_type: "formulario_whatsapp",
        page_url: window.location.href,
      };
      
      // URL do webhook definida diretamente
      const webhookUrl = 
        "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/de710246-9116-4dcd-8712-98207717104c";
      
      console.log("[BottomWhatsAppForm] Enviando dados para API:", {
        endpoint: "/api/leads",
        leadData: {
          ...leadData,
          phone: "REDACTED", // Redact phone for privacy in logs
        },
        hasWebhookUrl: !!webhookUrl,
      });
      
      // Usar a API para enviar dados para Supabase e webhook
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...leadData,
          webhookUrl: webhookUrl,
        }),
      });
      
      console.log("[BottomWhatsAppForm] Resposta da API recebida:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });
      
      const responseData = await response.json();
      console.log("[BottomWhatsAppForm] Dados da resposta da API:", responseData);
      
      if (!response.ok) {
        console.error("[BottomWhatsAppForm] Erro na resposta da API:", responseData);
      }
    } catch (error) {
      console.error("[BottomWhatsAppForm] Erro ao enviar para API:", error);
      // Não interromper o fluxo por causa do erro na API
    }

    const modal = document.getElementById("contactModal")
    if (modal) {
      localStorage.setItem("whatsappNumber", number)
      modal.style.display = "flex"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedNumber = phoneNumber.replace(/\D/g, "")

    if (cleanedNumber.length >= 10 && cleanedNumber.length <= 13) {
      openModal(phoneNumber)
      // Reset form
      setPhoneNumber("")
      localStorage.removeItem("whatsappNumber") // Adicionar esta linha
    } else {
      alert("Por favor, digite um número de WhatsApp válido")
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
    <section className="py-16 bg-gray-900 text-white">
      <div className="container">
        <div className="max-w-2xl mx-auto bg-white rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Dar o próximo passo leva menos de um minuto
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-4">1</div>
              <h4 className="text-lg font-semibold mb-2">Preencha o formulário</h4>
              <p className="text-gray-300">
                Entre em contato com a equipe da VFX. Todo o resto do processo é gratuito!
              </p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-4">2</div>
              <h4 className="text-lg font-semibold mb-2">Receba uma ligação</h4>
              <p className="text-gray-300">
                Em até 24 horas, um especialista vai analisar o seu caso e entrar em contato com você.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <WhatsappIcon className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="Digite aqui seu WhatsApp..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 text-base"
                maxLength={15}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-[#48ce34] text-white rounded-lg font-semibold hover:bg-[#3db82c] transition-all shadow-[0_8px_30px_rgb(72,206,52,0.3)] hover:shadow-[0_8px_40px_rgb(72,206,52,0.45)] hover:translate-y-[-1px]"
            >
              AGENDAR REUNIÃO GRATUITA
            </button>
          </form>
        </div>
      </div>
    </section>
  )
} 