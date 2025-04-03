export const webhookConfig = {
  // Em produção, o webhook deve estar sempre ativado
  WEBHOOK_ENABLED:
    process.env.NODE_ENV === "production"
      ? true
      : typeof window !== "undefined" && localStorage && localStorage.getItem("webhook_enabled") === "false"
        ? false
        : true,

  // Mensagem quando o webhook está desativado (apenas em desenvolvimento)
  DISABLED_SUCCESS_MESSAGE: "Webhook está desativado. Simulando sucesso do envio.",

  // URLs padrão para webhooks
  DEFAULT_URLS: {
    CONTACT_FORM:
      "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/f590fb28-1dd6-4aca-8164-89736275a973",
    WHATSAPP_FORM:
      "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/de710246-9116-4dcd-8712-98207717104c",
    PRESENTATION_FORM:
      "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/VeZHQd1UkMP42ero9Z0E",
  },
}

