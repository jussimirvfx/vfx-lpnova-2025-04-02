"use client"

import { useState, useEffect } from "react"
import { webhookConfig } from "@/lib/webhook-config"

export function WebhookToggle() {
  const [isEnabled, setIsEnabled] = useState(webhookConfig.WEBHOOK_ENABLED)
  const [showAdmin, setShowAdmin] = useState(false)

  // Função para alternar o estado do webhook
  const toggleWebhook = () => {
    // Atualizar o estado local
    const newState = !isEnabled
    setIsEnabled(newState)

    // Atualizar a configuração global
    webhookConfig.WEBHOOK_ENABLED = newState

    // Salvar no localStorage para persistir entre recarregamentos
    localStorage.setItem("webhook_enabled", newState ? "true" : "false")

    console.log(`Webhook ${newState ? "ativado" : "desativado"} com sucesso!`)
  }

  // Carregar o estado do localStorage ao montar o componente
  useEffect(() => {
    // Verificar se estamos no ambiente de desenvolvimento
    const isDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app")

    setShowAdmin(isDev)

    const savedState = localStorage.getItem("webhook_enabled")
    if (savedState !== null) {
      const enabled = savedState === "true"
      setIsEnabled(enabled)
      webhookConfig.WEBHOOK_ENABLED = enabled
    }
  }, [])

  // Se não estiver no ambiente de desenvolvimento, não mostrar nada
  if (!showAdmin) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <label htmlFor="webhook-toggle" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="webhook-toggle"
              className="sr-only"
              checked={isEnabled}
              onChange={toggleWebhook}
            />
            <div className={`w-11 h-6 rounded-full transition ${isEnabled ? "bg-green-500" : "bg-gray-300"}`}>
              <div
                className={`w-5 h-5 rounded-full bg-white transition transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">
              Webhook {isEnabled ? "Ativado" : "Desativado"}
            </span>
          </label>
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {isEnabled ? "Enviando dados reais para o webhook" : "Modo de teste: simulando sucesso do webhook"}
      </div>
    </div>
  )
}

