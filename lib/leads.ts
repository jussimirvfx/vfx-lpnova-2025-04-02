"use server"

import { supabase } from "./supabase"
import type { Database } from "@/types/supabase"
import { testSupabaseConnection } from "@/lib/supabase-utils"
import { webhookConfig } from "@/lib/webhook-config"

type Lead = Database["public"]["Tables"]["leads"]["Insert"]

// Função para formatar o timestamp no formato que o Supabase aceita
function getSpTimestamp() {
  return new Date().toISOString()
}

// Função para sanitizar os dados do lead
function sanitizeLeadData(lead: Lead) {
  return {
    // Campos obrigatórios
    form_type: lead.form_type,
    source: lead.source,

    // Campos opcionais com validação
    name: lead.name?.trim() || null,
    email: lead.email?.trim().toLowerCase() || null,
    phone: lead.phone ? lead.phone.replace(/\D/g, "") : null,
    company: lead.company?.trim() || null,
    sales_team_size: lead.sales_team_size || null,
    monthly_revenue: lead.monthly_revenue || null,
    segment: lead.segment || null,
    message: lead.message?.trim() || null,
    country_code: lead.country_code || null,
    page_url: lead.page_url || null,
    facebook_pixel_id: lead.facebook_pixel_id || null,
  }
}

// Função para validar os dados antes de enviar ao Supabase
function validateLeadData(lead: Lead): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!lead.form_type) errors.push("form_type is required")
  if (!lead.source) errors.push("source is required")

  // Validar email se fornecido
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    errors.push("Invalid email format")
  }

  // Validar telefone se fornecido
  if (lead.phone && !/^\+?[\d\s-()]{10,}$/.test(lead.phone)) {
    errors.push("Invalid phone format")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Adicionar logs mais detalhados para o salvamento de leads

// Função para salvar lead no Supabase
export async function saveLead(lead: Lead) {
  console.log("[Leads] === INICIANDO SALVAMENTO DE LEAD NO SUPABASE ===", {
    timestamp: new Date().toISOString(),
  })

  // Check if this is a test lead
  const isTestLead = lead.source?.includes("Teste") || lead.form_type?.includes("teste")
  if (isTestLead) {
    console.log("[Leads] === PROCESSANDO LEAD DE TESTE ===")
    console.log("[Leads] Detalhes adicionais do lead de teste:", {
      test_id: (lead as any).test_id,
      timestamp: (lead as any).timestamp,
      page_url: lead.page_url,
    })
  }

  console.log("[Leads] Dados do lead:", {
    form_type: lead.form_type,
    source: lead.source,
    // Mascarar dados sensíveis
    phone: lead.phone ? `${lead.phone.substring(0, 3)}...${lead.phone.substring(lead.phone.length - 3)}` : null,
    email: lead.email ? `${lead.email.substring(0, 3)}...${lead.email.substring(lead.email.indexOf("@"))}` : null,
    has_name: !!lead.name,
    has_company: !!lead.company,
    has_message: !!lead.message,
    timestamp: new Date().toISOString(),
  })

  try {
    // Validar dados
    const validation = validateLeadData(lead)
    if (!validation.isValid) {
      console.error("[Leads] Dados de lead inválidos:", validation.errors)
      throw new Error(`Invalid lead data: ${validation.errors.join(", ")}`)
    }

    // Verificar conexão com Supabase
    console.log("[Leads] Verificando conexão com Supabase...")
    const isConnected = await testSupabaseConnection()
    if (!isConnected) {
      console.error("[Leads] Não foi possível conectar ao Supabase")
      throw new Error("Unable to connect to Supabase")
    }
    console.log("[Leads] Conexão com Supabase verificada com sucesso")

    // Sanitizar e preparar dados
    const sanitizedData = sanitizeLeadData(lead)
    const leadData = {
      ...sanitizedData,
      created_at: getSpTimestamp(),
    }
    console.log("[Leads] Dados sanitizados e preparados para inserção:", {
      form_type: leadData.form_type,
      source: leadData.source,
      has_phone: !!leadData.phone,
      has_email: !!leadData.email,
      created_at: leadData.created_at,
    })

    // Inserir no Supabase com retry
    let retryCount = 0
    const maxRetries = 3
    let lastError = null

    while (retryCount < maxRetries) {
      try {
        console.log(`[Leads] Tentativa ${retryCount + 1} de ${maxRetries} de inserção no Supabase`)

        // Adicionar timeout para a operação
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout ao inserir no Supabase")), 10000)
        })

        const insertPromise = supabase.from("leads").insert([leadData]).select().single()

        // Usar Promise.race para implementar o timeout
        const { data, error } = (await Promise.race([
          insertPromise,
          timeoutPromise.then(() => {
            throw new Error("Timeout ao inserir no Supabase")
          }),
        ])) as any

        if (error) {
          console.error(`[Leads] Erro na tentativa ${retryCount + 1}:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          throw error
        }

        console.log("[Leads] Lead salvo com sucesso no Supabase:", {
          id: data?.id,
          timestamp: data?.created_at,
        })

        return { success: true, data }
      } catch (error) {
        lastError = error
        retryCount++
        console.error(`[Leads] Falha na tentativa ${retryCount} de ${maxRetries}:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        })

        if (retryCount === maxRetries) break

        // Exponential backoff
        const backoffTime = Math.pow(2, retryCount) * 1000
        console.log(`[Leads] Aguardando ${backoffTime}ms antes da próxima tentativa...`)
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
      }
    }

    console.error("[Leads] Todas as tentativas de salvar o lead falharam")
    throw lastError || new Error("Failed to save lead after max retries")
  } catch (error) {
    console.error("[Leads] Erro em saveLead:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : "Unknown error",
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save lead",
    }
  } finally {
    console.log("[Leads] === FIM DO PROCESSO DE SALVAMENTO DE LEAD ===")
  }
}

// Nova função para verificar e deletar leads anteriores com o mesmo número de telefone
async function checkAndDeletePreviousLead(phone: string): Promise<boolean> {
  if (!phone) {
    console.log("[Leads] Telefone não fornecido para verificação de leads anteriores")
    return false
  }

  console.log(`[Leads] === INICIANDO VERIFICAÇÃO DE LEADS ANTERIORES ===`, {
    timestamp: new Date().toISOString(),
    operation: "check_previous_leads",
    phonePrefix: phone.substring(0, 3),
    phoneLength: phone.length,
  })

  try {
    // Buscar leads anteriores com o mesmo número de telefone
    console.log(`[Leads] Buscando leads com o telefone: ${phone.substring(0, 3)}...`)

    const { data, error } = await supabase
      .from("leads")
      .select("id, form_type, name, email, company, created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Leads] Erro ao buscar leads anteriores:", error)
      return false
    }

    console.log(`[Leads] Resultado da busca de leads anteriores:`, {
      found: !!data,
      count: data?.length || 0,
    })

    if (!data || data.length === 0) {
      console.log("[Leads] Nenhum lead anterior encontrado com este telefone")
      return false
    }

    // Verificar se há leads anteriores que são apenas do formulário básico
    // (apenas WhatsApp, sem informações completas)
    const basicLeads = data.filter((lead) => lead.form_type === "formulario_whatsapp")

    console.log(`[Leads] Leads básicos encontrados:`, {
      count: basicLeads.length,
      details: basicLeads.map((l) => ({
        id: l.id,
        formType: l.form_type,
        hasName: !!l.name,
        hasEmail: !!l.email,
        createdAt: l.created_at,
      })),
    })

    if (basicLeads.length === 0) {
      console.log("[Leads] Nenhum lead básico encontrado para deletar")
      return false
    }

    console.log(`[Leads] Encontrados ${basicLeads.length} leads básicos para deletar`)

    // Deletar os leads básicos
    for (const lead of basicLeads) {
      console.log(`[Leads] Tentando deletar lead ${lead.id}...`)

      const { error: deleteError } = await supabase.from("leads").delete().eq("id", lead.id)

      if (deleteError) {
        console.error(`[Leads] Erro ao deletar lead ${lead.id}:`, {
          error: deleteError,
          leadId: lead.id,
          timestamp: new Date().toISOString(),
        })
      } else {
        console.log(`[Leads] Lead ${lead.id} deletado com sucesso`, {
          leadId: lead.id,
          formType: lead.form_type,
          hadName: !!lead.name,
          hadEmail: !!lead.email,
          hadCompany: !!lead.company,
          timestamp: new Date().toISOString(),
        })
      }
    }

    return true
  } catch (error) {
    console.error("[Leads] Erro ao verificar e deletar leads anteriores:", {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return false
  }
}

// Nova função otimizada para enviar para webhook
async function sendToWebhook(lead: Lead, webhookUrl: string): Promise<boolean> {
  try {
    // Verificar se o webhook está desativado para testes
    if (!webhookConfig.WEBHOOK_ENABLED) {
      console.log(webhookConfig.DISABLED_SUCCESS_MESSAGE)
      console.log("Dados que seriam enviados:", {
        url: webhookUrl,
        formType: lead.form_type,
        source: lead.source,
        timestamp: new Date().toISOString(),
      })
      return true // Simular sucesso
    }

    // Log inicial com redação de dados sensíveis
    console.log("Iniciando envio para webhook:", {
      url: webhookUrl,
      formType: lead.form_type,
      source: lead.source,
      timestamp: new Date().toISOString(),
    })

    // Formatar número de telefone corretamente
    const phoneNumber = lead.phone?.replace(/\D/g, "")
    const formattedPhone = phoneNumber?.startsWith("55") ? `+${phoneNumber}` : `+55${phoneNumber}`

    // Preparar payload no formato correto (estrutura plana)
    const webhookData = {
      phone: formattedPhone,
      name: lead.name || "",
      email: lead.email || "",
      company: lead.company || "",
      sales_team_size: lead.sales_team_size || "",
      monthly_revenue: lead.monthly_revenue || "",
      segment: lead.segment || "",
      message: lead.message || "",
      source: lead.source || "Website",
      form_type: lead.form_type || "",
      page_url: lead.page_url || "https://vendas.agenciavfx.com.br/",
    }

    // Log do payload (com dados sensíveis redatados)
    console.log("Payload do webhook:", {
      ...webhookData,
      phone: "REDACTED",
      email: "REDACTED",
    })

    // Fazer a requisição com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "User-Agent": "VFX-Webhook/1.0",
      },
      body: JSON.stringify(webhookData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Log da resposta
    console.log("Resposta do webhook:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    })

    // Verificar resposta
    if (!response.ok) {
      throw new Error(`Webhook falhou com status ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Erro no webhook:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : "Erro desconhecido",
      webhookUrl,
      timestamp: new Date().toISOString(),
    })

    throw error
  }
}

// Função principal atualizada para salvar lead com webhook
export async function saveLeadWithWebhook(lead: Lead, webhookUrl: string) {
  console.log("[Leads] === INICIANDO PROCESSO DE SAVE_LEAD_WITH_WEBHOOK ===", {
    timestamp: new Date().toISOString(),
    formType: lead.form_type,
    source: lead.source,
    hasPhone: !!lead.phone,
    hasName: !!lead.name,
    hasEmail: !!lead.email,
  })

  try {
    // Validar URL do webhook
    if (!webhookUrl) {
      throw new Error("URL do webhook é obrigatória")
    }

    try {
      new URL(webhookUrl)
    } catch (error) {
      throw new Error(`URL do webhook inválida: ${webhookUrl}`)
    }

    // NOVA LÓGICA: Verificar se é um formulário completo e se deve deletar leads anteriores
    // Verificação explícita para formulário de reunião WhatsApp
    if (lead.form_type === "formulario_reuniao_whatsapp") {
      console.log("[Leads] Detectado formulário de reunião WhatsApp completo", {
        hasPhone: !!lead.phone,
        hasName: !!lead.name,
        hasEmail: !!lead.email,
      })

      if (lead.phone) {
        console.log("[Leads] Iniciando verificação de leads anteriores para deletar")
        // Forçar a execução da verificação de leads anteriores
        const deletionResult = await checkAndDeletePreviousLead(lead.phone)
        console.log("[Leads] Resultado da verificação de leads anteriores:", {
          success: deletionResult,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Variáveis para controle de status
    let webhookSuccess = false
    let webhookError = null
    let supabaseSuccess = false
    let supabaseError = null

    // 1. Tentar webhook primeiro (com 3 tentativas)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`Tentativa ${attempt + 1} de envio para webhook`)
        webhookSuccess = await sendToWebhook(lead, webhookUrl)

        if (webhookSuccess) {
          console.log("Webhook enviado com sucesso na tentativa:", attempt + 1)
          break
        }
      } catch (error) {
        webhookError = error
        console.error(`Falha na tentativa ${attempt + 1} do webhook:`, error)

        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }
    }

    // 2. Tentar Supabase (independente do resultado do webhook)
    try {
      const supabaseResult = await saveLead(lead)
      supabaseSuccess = supabaseResult.success
      if (!supabaseResult.success) {
        supabaseError = supabaseResult.error
      }
    } catch (error) {
      supabaseError = error
      console.error("Falha ao salvar no Supabase:", error)
    }

    // Log do resultado final
    console.log("Resultado final da operação:", {
      webhookSuccess,
      webhookError: webhookError
        ? {
            message: webhookError instanceof Error ? webhookError.message : "Erro desconhecido",
          }
        : null,
      supabaseSuccess,
      supabaseError: supabaseError
        ? {
            message: supabaseError instanceof Error ? supabaseError.message : "Erro desconhecido",
          }
        : null,
    })

    // Retornar sucesso se pelo menos um método funcionou
    if (webhookSuccess || supabaseSuccess) {
      return {
        success: true,
        warning: !webhookSuccess
          ? "Webhook falhou mas Supabase funcionou"
          : !supabaseSuccess
            ? "Supabase falhou mas webhook funcionou"
            : undefined,
      }
    }

    // Se ambos falharam, lançar erro detalhado
    throw new Error(
      `Ambos webhook e Supabase falharam. ` +
        `Erro do webhook: ${webhookError instanceof Error ? webhookError.message : "Erro desconhecido"}. ` +
        `Erro do Supabase: ${supabaseError instanceof Error ? supabaseError.message : "Erro desconhecido"}`,
    )
  } catch (error) {
    console.error("Erro final em saveLeadWithWebhook:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      formType: lead.form_type,
      source: lead.source,
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Falha ao processar lead",
    }
  }
}

