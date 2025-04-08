"use client"

import type React from "react"

import { PhoneIcon as WhatsappIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { generateEventId, normalizeAndHashPhone, getFbc, getFbp } from "@/lib/meta-conversion-api"
import { isEventAlreadySent, markEventAsSent } from "@/lib/event-deduplication"
import { getMetaParams, prepareUserData } from "@/lib/meta-utils"
import { sendGA4Event, sendMeasurementProtocolEvent } from "@/lib/ga4/events"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function BottomWhatsAppForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Adicionar este useEffect para ler o número do WhatsApp salvo
  useEffect(() => {
    const savedPhone = localStorage.getItem("whatsappNumber")
    if (savedPhone) {
      setPhoneNumber(savedPhone)
    }
  }, [])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Permitir apenas números, remover quaisquer caracteres não numéricos
    const numericInput = input.replace(/\D/g, "")
    setPhoneNumber(numericInput)
  }

  const openModal = async (number: string) => {
    if (isSubmitting) return; // Evitar cliques múltiplos
    setIsSubmitting(true);

    // Normalizar número para formato internacional (ex: +5511999998888)
    let normalizedNumber = number.trim().replace(/\D/g, "");
    if (normalizedNumber.length === 10 || normalizedNumber.length === 11) {
      // Adicionar prefixo 55 se não tiver
      normalizedNumber = `55${normalizedNumber}`;
    }

    if (normalizedNumber.length < 12 || normalizedNumber.length > 13) {
      toast({
        title: "Erro",
        description: "Número de telefone inválido. Use o formato (XX) XXXXX-XXXX.",
        variant: "destructive",
      })
      setIsSubmitting(false);
      return
    }

    // Obter fbc e fbp (já estava presente)
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
      // Verificar se a função global do Meta está disponível
      if (window.sendMetaEvent) {
        // Gerar um ID de evento único para deduplicação entre pixel e API
        const metaEventId = generateEventId(); // ID específico para Meta

        // Obter parâmetros do Meta
        const metaParams = getMetaParams();

        // Preparar dados do usuário com telefone hasheado para Meta
        const metaUserData = prepareUserData({
          phone: normalizedNumber,
          fbc: metaParams.fbc,
          fbp: metaParams.fbp
        });

        // --- Envio Meta (existente) ---
        window.sendMetaEvent(
          "Contact",
          {
            content_name: "Bottom WhatsApp Form",
            content_category: "WhatsApp Submission",
          },
          {
            user_data: metaUserData,
            eventID: metaEventId,
          },
        );

        console.log("[BottomWhatsAppForm] Evento 'Contact' Meta enviado com ID: " + metaEventId);
        console.log("[BottomWhatsAppForm] Dados do usuário Meta:", {
          phone: normalizedNumber.substring(0, 4) + "***",
          hasFbc: !!metaParams.fbc,
          hasFbp: !!metaParams.fbp,
          hasPhoneHash: !!metaUserData.ph?.[0],
          phoneHash: metaUserData.ph?.[0]?.substring(0, 8) + "..."
        });

        // --- Envio GA4 (novo) ---
        const ga4EventParams = {
            item_name: "Bottom WhatsApp Form", // Equivalente a content_name
            item_category: "WhatsApp Submission", // Equivalente a content_category
            // Adicionar outros parâmetros GA4 relevantes se necessário
        };

        // Enviar evento GA4 via gtag (cliente)
        // Usar o número de telefone como identificador único para deduplicação neste form
        sendGA4Event('contact', ga4EventParams, `whatsapp_${normalizedNumber}`);

        // Preparar dados para Measurement Protocol
        // Reutiliza dados já disponíveis, mas não envia PII diretamente
        const ga4MpEventData = {
          // client_id será obtido automaticamente pela função sendMeasurementProtocolEvent
          // non_personalized_ads: false, // Opcional: configurar com base no consentimento
          user_properties: { // Propriedades do usuário (opcional)
            // user_language: { value: navigator.language }, // Exemplo
          },
          events: [{
            name: 'contact',
            params: {
                ...ga4EventParams,
                // Adicionar parâmetros específicos do servidor se necessário
                // Ex: source_platform: 'web'
                // NÃO ENVIAR PII (telefone) DIRETAMENTE AQUI
                // O Google recomenda usar User-ID ou dados fornecidos pelo usuário (com consentimento)
                // que são hasheados pelo Google.
                 // 'phone_hash': hashed_phone_number // Exemplo se tivéssemos o hash SHA256
            }
          }]
        };

        // Enviar evento GA4 via Measurement Protocol (servidor)
        sendMeasurementProtocolEvent(ga4MpEventData);

      } else {
          console.warn("[BottomWhatsAppForm] window.sendMetaEvent não disponível.");
      }

      // Abrir WhatsApp após rastreamento
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${normalizedNumber}&text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20VFX.`
      window.open(whatsappUrl, "_blank")

      toast({
        title: "Sucesso",
        description: "Abrindo conversa no WhatsApp...",
      })

    } else {
        console.warn("[BottomWhatsAppForm] Fora do ambiente do navegador.");
    }

    setIsSubmitting(false); // Habilitar botão novamente
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
                onChange={handlePhoneNumberChange}
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