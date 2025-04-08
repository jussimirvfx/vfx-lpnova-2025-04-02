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
    const input = e.target.value;
    // Usar a função formatPhoneNumber para formatar o número enquanto digita
    setPhoneNumber(formatPhoneNumber(input));
  }

  const openModal = async (number: string) => {
    if (isSubmitting) return; // Evitar cliques múltiplos
    setIsSubmitting(true);

    try {
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
        return;
      }

      // Verificar se o evento já foi enviado recentemente
      const formIdentifier = `contact_whatsapp_${normalizedNumber}`;
      if (isEventAlreadySent("Contact", formIdentifier)) {
        console.log("[BottomWhatsAppForm] Evento Contact já enviado recentemente, ignorando duplicação");
        
        // Continuar abrindo o modal mesmo que o evento já tenha sido enviado
        const modal = document.getElementById("contactModal");
        if (modal) {
          localStorage.setItem("whatsappNumber", number);
          modal.style.display = "flex";
        }
        
        setIsSubmitting(false);
        return;
      }

      // Obter fbc e fbp
      const fbc = getFbc();
      const fbp = getFbp();

      // Registrar fbc e fbp para debug
      console.log("[BottomWhatsAppForm] FBC e FBP para rastreamento:", {
        hasFbc: !!fbc,
        fbcSample: fbc ? fbc.substring(0, 12) + "..." : "não encontrado",
        hasFbp: !!fbp,
        fbpSample: fbp ? fbp.substring(0, 12) + "..." : "não encontrado"
      });

      // Track evento de Contact 
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
            events: [{
              name: 'contact',
              params: {
                  ...ga4EventParams,
              }
            }]
          };

          // Enviar evento GA4 via Measurement Protocol (servidor)
          sendMeasurementProtocolEvent(ga4MpEventData);
          
          // Marcar evento como enviado
          markEventAsSent("Contact", formIdentifier, { eventId: metaEventId });
        } else {
          console.warn("[BottomWhatsAppForm] window.sendMetaEvent não disponível.");
        }
      }
      
      // Enviar dados para API (se necessário)
      try {
        // Preparar dados do lead (se necessário)
        const leadData = {
          phone: normalizedNumber,
          source: "Bottom WhatsApp Form",
          form_type: "formulario_whatsapp",
          page_url: window.location.href,
        };
        
        // Fazer chamada para API interna (se necessário)
        // const response = await fetch("/api/leads", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(leadData),
        // });
        
        console.log("[BottomWhatsAppForm] Dados preparados para formulário:", {
          phone: normalizedNumber.substring(0, 4) + "***",
          source: leadData.source,
          form_type: leadData.form_type
        });
      } catch (apiError) {
        console.error("[BottomWhatsAppForm] Erro ao processar dados:", apiError);
        // Não interromper o fluxo por causa do erro
      }
      
      // PARTE RESTAURADA: Abrir o modal do formulário em vez de redirecionar para o WhatsApp
      const modal = document.getElementById("contactModal");
      if (modal) {
        localStorage.setItem("whatsappNumber", number);
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Prevenir scroll
      } else {
        console.error("[BottomWhatsAppForm] Modal não encontrado no DOM");
        toast({
          title: "Erro",
          description: "Não foi possível abrir o formulário de contato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[BottomWhatsAppForm] Erro inesperado:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // Habilitar botão novamente
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