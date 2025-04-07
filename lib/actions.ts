"use server"

import { revalidatePath } from "next/cache"
import { saveLeadWithWebhook } from "./leads"

interface FormResult {
  success: boolean
  error?: string
  data?: any
}

// Função auxiliar para formatar o segmento
function formatSegment(segment: string) {
  return segment.replace(/\//g, "-")
}

// Função auxiliar para formatar dados do formulário
function formatFormData(formData: FormData, source: string, formType: string) {
  // Validar e limpar dados
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const phone = (formData.get("phone") as string)?.replace(/\D/g, "")
  const countryCode = formData.get("countryCode") as string
  const company = (formData.get("company") as string)?.trim()
  const salesTeamSize = formData.get("salesTeamSize") as string
  const monthlyRevenue = formData.get("monthlyRevenue") as string
  const segment = formData.get("segment") as string
  const message = (formData.get("message") as string)?.trim()
  const site = (formData.get("site") as string)?.trim()
  const lead_score = Number(formData.get("lead_score")) || 0
  const pageUrl = formData.get("pageUrl") as string
  // Capturar o ID externo se disponível
  const external_id = formData.get("external_id") as string || null

  // Validar dados obrigatórios
  if (!name || !email || !phone || !countryCode || !segment || !company || !message) {
    throw new Error("Todos os campos obrigatórios devem ser preenchidos")
  }

  return {
    name,
    email,
    phone: `${countryCode}${phone}`,
    company,
    sales_team_size: salesTeamSize,
    monthly_revenue: monthlyRevenue,
    segment: formatSegment(segment),
    message,
    site,
    lead_score,
    source,
    country_code: countryCode,
    page_url: pageUrl,
    form_type: formType,
    external_id: external_id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  }
}

export async function submitContactForm(formData: FormData): Promise<FormResult> {
  try {
    // Formatar dados do formulário com validação
    const leadData = formatFormData(formData, "Contact Modal Form", "formulario_reuniao_whatsapp")

    // Enviar para webhook e Supabase
    const result = await saveLeadWithWebhook(
      leadData,
      "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/f590fb28-1dd6-4aca-8164-89736275a973",
    )

    if (!result.success) {
      console.error("Erro ao salvar lead:", result.error)
      return {
        success: false,
        error: result.error || "Erro ao salvar lead",
      }
    }

    // Revalidar página de obrigado
    revalidatePath("/obrigado")

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Erro em submitContactForm:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar formulário",
    }
  }
}

export async function submitPresentationForm(formData: FormData): Promise<FormResult> {
  try {
    // Formatar dados do formulário com validação
    const leadData = formatFormData(formData, "Presentation Modal Form", "formulario_apresentacao")

    // Enviar para webhook e Supabase
    const result = await saveLeadWithWebhook(
      leadData,
      "https://services.leadconnectorhq.com/hooks/XFuL1RK1hhJf7b7Zg0ah/webhook-trigger/f590fb28-1dd6-4aca-8164-89736275a973",
    )

    if (!result.success) {
      console.error("Erro ao salvar lead:", result.error)
      return {
        success: false,
        error: result.error || "Erro ao salvar lead",
      }
    }

    // Revalidar página de apresentação
    revalidatePath("/apresentacao")

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Erro em submitPresentationForm:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar formulário",
    }
  }
}

