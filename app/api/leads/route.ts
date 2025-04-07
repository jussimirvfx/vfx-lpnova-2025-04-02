import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { headers } from "next/headers"
import { webhookConfig } from "@/lib/webhook-config"

export const runtime = "nodejs"

// Função para verificar e deletar leads anteriores com o mesmo número de telefone
async function checkAndDeletePreviousLead(phone: string): Promise<boolean> {
  if (!phone) return false

  console.log(`[API:leads] Verificando leads anteriores com o telefone: ${phone.substring(0, 3)}...`, {
    timestamp: new Date().toISOString(),
    operation: "check_previous_leads_api",
  })

  try {
    // Buscar leads anteriores com o mesmo número de telefone
    const { data, error } = await supabase
      .from("leads")
      .select("id, form_type, name, email, company")
      .eq("phone", phone)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API:leads] Erro ao buscar leads anteriores:", error)
      return false
    }

    if (!data || data.length === 0) {
      console.log("[API:leads] Nenhum lead anterior encontrado com este telefone")
      return false
    }

    // Verificar se há leads anteriores que são apenas do formulário básico
    const basicLeads = data.filter((lead) => lead.form_type === "formulario_whatsapp")

    if (basicLeads.length === 0) {
      console.log("[API:leads] Nenhum lead básico encontrado para deletar")
      return false
    }

    console.log(`[API:leads] Encontrados ${basicLeads.length} leads básicos para deletar`)

    // Deletar os leads básicos
    for (const lead of basicLeads) {
      const { error: deleteError } = await supabase.from("leads").delete().eq("id", lead.id)

      if (deleteError) {
        console.error(`[API:leads] Erro ao deletar lead ${lead.id}:`, deleteError)
      } else {
        console.log(`[API:leads] Lead ${lead.id} deletado com sucesso`)
      }
    }

    return true
  } catch (error) {
    console.error("[API:leads] Erro ao verificar e deletar leads anteriores:", error)
    return false
  }
}

// Função para criar resposta de sucesso rápida
function createSuccessResponse(corsHeaders: Record<string, string>, data?: any) {
  return NextResponse.json(
    {
      success: true,
      message: "Request accepted for processing",
      ...data,
    },
    { headers: corsHeaders },
  )
}

export async function POST(request: Request) {
  console.log("[API:leads] === INICIANDO PROCESSAMENTO DE LEAD NA API ===", {
    timestamp: new Date().toISOString(),
  })

  const headersList = headers()
  const origin = headersList.get("origin") || "*"

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Test-Request",
  }

  try {
    // Verificar variáveis de ambiente do Supabase
    const supabaseUrl = process.env.SUPABASELEADS_SUPABASE_URL
    const supabaseKey = process.env.SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY

    const envStatus = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) + "..." : "AUSENTE",
      environment: process.env.NODE_ENV || "unknown",
    }

    console.log("[API:leads] Variáveis de ambiente:", envStatus)

    // Analisar o corpo da requisição
    let data
    try {
      data = await request.json()
      console.log("[API:leads] Requisição JSON analisada com sucesso")
    } catch (parseError) {
      console.error("[API:leads] Erro ao analisar JSON da requisição:", {
        error: parseError instanceof Error ? parseError.message : "Unknown error",
      })
      return NextResponse.json(
        { success: false, error: "Erro ao analisar JSON da requisição" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Logging dos dados recebidos com mascaramento de dados sensíveis
    console.log("[API:leads] Dados recebidos:", {
      form_type: data.form_type,
      form_name: data.form_type === "formulario_whatsapp" 
        ? "Formulário WhatsApp Simples" 
        : data.form_type === "formulario_reuniao_whatsapp" 
          ? "Formulário de Reunião Completo"
          : data.form_type === "formulario_apresentacao"
            ? "Formulário de Apresentação"
            : "Formulário Desconhecido",
      source: data.source,
      has_phone: !!data.phone,
      has_email: !!data.email,
      has_name: !!data.name,
      has_webhook: !!data.webhookUrl,
      webhook_url: data.webhookUrl ? data.webhookUrl.substring(0, 30) + "..." : "não fornecida",
      sales_team_size: data.sales_team_size,
      monthly_revenue: data.monthly_revenue,
      message: data.message ? "presente" : "ausente"
    })

    // Validar campos obrigatórios
    if (!data.form_type || !data.source) {
      console.error("[API:leads] Campos obrigatórios ausentes", {
        hasFormType: !!data.form_type,
        hasSource: !!data.source,
      })
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Extrair webhook URL
    const { webhookUrl, ...leadData } = data

    // Filtrar dados para incluir apenas campos válidos
    const validFields = [
      "name",
      "email",
      "phone",
      "company",
      "sales_team_size",
      "monthly_revenue",
      "segment",
      "message",
      "source",
      "country_code",
      "page_url",
      "form_type",
      "facebook_pixel_id",
      "site",
      "lead_score",
      "qualified",
      "qualification_reason"
    ]

    const filteredData = Object.keys(leadData)
      .filter((key) => validFields.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = leadData[key]
          return obj
        },
        {} as Record<string, any>,
      )

    // Adicionar timestamp e Facebook Pixel ID
    const leadWithTimestamp = {
      ...filteredData,
      created_at: new Date().toISOString(),
      facebook_pixel_id: process.env.FACEBOOK_PIXEL_ID || null,
    }

    console.log("[API:leads] Dados preparados para inserção:", {
      form_type: leadWithTimestamp.form_type,
      source: leadWithTimestamp.source,
      phone_masked: leadWithTimestamp.phone ? `${leadWithTimestamp.phone.substring(0, 3)}...` : null,
    })

    // NOVA LÓGICA: Verificar se é um formulário completo e se deve deletar leads anteriores
    if (
      leadWithTimestamp.form_type === "formulario_reuniao_whatsapp" &&
      leadWithTimestamp.phone &&
      leadWithTimestamp.name &&
      leadWithTimestamp.email
    ) {
      console.log("[API:leads] Detectado formulário completo, verificando leads anteriores para deletar")
      await checkAndDeletePreviousLead(leadWithTimestamp.phone)
    }

    // Testar conexão com Supabase primeiro
    const testResult = await supabase.from("leads").select("count").limit(1)

    if (testResult.error) {
      console.error("[API:leads] Erro ao testar conexão com Supabase:", {
        message: testResult.error.message,
        details: testResult.error.details,
        hint: testResult.error.hint,
        code: testResult.error.code,
      })

      return NextResponse.json(
        {
          success: false,
          error: "Erro de conexão com Supabase",
          details: testResult.error.message,
          env: envStatus,
        },
        { status: 500, headers: corsHeaders },
      )
    }

    console.log("[API:leads] Conexão com Supabase testada com sucesso")

    // Inserir lead no Supabase
    console.log("[API:leads] [Supabase] Iniciando inserção no banco de dados", {
      form_type: leadWithTimestamp.form_type,
      source: leadWithTimestamp.source,
      timestamp: new Date().toISOString(),
    });

    const supabaseResult = await supabase.from("leads").insert([leadWithTimestamp]).select()

    if (supabaseResult.error) {
      console.error("[API:leads] [Supabase] Erro ao salvar lead no banco de dados:", {
        message: supabaseResult.error.message,
        details: supabaseResult.error.details,
        hint: supabaseResult.error.hint,
        code: supabaseResult.error.code,
      })

      return NextResponse.json(
        {
          success: false,
          error: "Erro ao salvar lead no Supabase",
          details: supabaseResult.error.message,
          env: envStatus,
        },
        { status: 500, headers: corsHeaders },
      )
    }

    console.log("[API:leads] [Supabase] ✅ Lead salvo no banco de dados com sucesso:", {
      id: supabaseResult.data?.[0]?.id,
      form_type: filteredData.form_type,
      created_at: new Date().toISOString(),
      detail: "Lead armazenado no banco de dados com sucesso"
    })

    // Enviar para webhook se URL for fornecida (ainda de forma assíncrona)
    if (webhookUrl) {
      try {
        // Verificar se o webhook está desativado para testes
        if (!webhookConfig.WEBHOOK_ENABLED) {
          console.log(webhookConfig.DISABLED_SUCCESS_MESSAGE)
        } else {
          console.log("[API:leads] [GoHighLevel] 🚀 Iniciando envio do lead para o CRM:", webhookUrl)

          // Formatar número de telefone corretamente
          const phoneNumber = leadData.phone?.replace(/\D/g, "")
          const formattedPhone = phoneNumber?.startsWith("55") ? `+${phoneNumber}` : `+55${phoneNumber}`

          // Preparar payload no formato correto (estrutura plana)
          const webhookData = {
            // Dados de contato básicos
            phone: formattedPhone,
            name: leadData.name || "",
            email: leadData.email || "",
            company: leadData.company || "",
            
            // Dados de qualificação
            sales_team_size: leadData.sales_team_size || "",
            monthly_revenue: leadData.monthly_revenue || "",
            segment: leadData.segment || "",
            message: leadData.message || "",
            site: leadData.site || "",  // Site ou Instagram da empresa
            
            // Dados de lead scoring e qualificação
            lead_score: leadData.lead_score || 0,
            qualified: leadData.qualified ? "Sim" : "Não", // Convertido para string para compatibilidade
            qualification_reason: leadData.qualification_reason || "",
            
            // Dados de fonte e origem
            source: leadData.source || "Website",
            form_type: leadData.form_type || "",
            page_url: leadData.page_url || "https://vendas.agenciavfx.com.br/",
            referrer: leadData.referrer || "",
            
            // Dados de UTM para rastreamento de campanhas
            utm_source: leadData.utm_source || "",
            utm_medium: leadData.utm_medium || "",
            utm_campaign: leadData.utm_campaign || "",
            utm_term: leadData.utm_term || "",
            utm_content: leadData.utm_content || "",
            
            // IDs de rastreamento
            gclid: leadData.gclid || "",  // Google Click ID
            fbclid: leadData.fbclid || "",  // Facebook Click ID
            fbc: leadData.fbc || "",  // Facebook Cookie
            fbp: leadData.fbp || "",  // Facebook Browser ID
            
            // ID externo para correlacionar com eventos da API de Conversão
            external_id: leadData.event_id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            
            // Timestamp da criação
            created_at: leadData.created_at || new Date().toISOString()
          }

          console.log("[API:leads] [GoHighLevel] Enviando dados para o CRM:", {
            webhook: webhookUrl.substring(0, 30) + "...",
            form_type: leadData.form_type,
            data: {
              ...webhookData,
              phone: webhookData.phone ? webhookData.phone.substring(0, 5) + "..." : null,
              email: webhookData.email ? webhookData.email.substring(0, 3) + "***" : null,
              external_id: webhookData.external_id
            }
          });

          // Fazer a chamada de API de forma síncrona e esperar a resposta
          try {
            const webhookResponse = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(webhookData),
            });

            const webhookResponseText = await webhookResponse.text();
            
            console.log("[API:leads] [GoHighLevel] Resposta do CRM:", {
              success: webhookResponse.ok,
              status: webhookResponse.status,
              statusText: webhookResponse.statusText,
              response: webhookResponseText.substring(0, 100) // Mostra apenas parte da resposta para evitar logs muito grandes
            });

            if (!webhookResponse.ok) {
              console.error("[API:leads] [GoHighLevel] ❌ ALERTA: Envio para CRM falhou!", {
                status: webhookResponse.status,
                statusText: webhookResponse.statusText,
                form_type: leadData.form_type,
                response: webhookResponseText
              });
            } else {
              console.log("[API:leads] [GoHighLevel] ✅ Lead enviado com sucesso para o CRM!", {
                form_type: leadData.form_type
              });
            }
          } catch (webhookFetchError) {
            console.error("[API:leads] [GoHighLevel] ❌ ERRO CRÍTICO: Falha ao enviar para CRM:", {
              error: webhookFetchError instanceof Error ? webhookFetchError.message : "Erro desconhecido",
              stack: webhookFetchError instanceof Error ? webhookFetchError.stack : undefined,
              webhookUrl: webhookUrl.substring(0, 30) + "...", // Mostra parte da URL para debugging
              form_type: leadData.form_type
            });
          }
        }
      } catch (webhookError) {
        console.error("[API:leads] Erro ao processar webhook:", {
          error: webhookError instanceof Error ? webhookError.message : "Erro desconhecido",
          stack: webhookError instanceof Error ? webhookError.stack : undefined,
        });
        // Não falhar a requisição por causa do webhook
      }
    }

    // Retornar resposta de sucesso com informações adicionais
    console.log("[API:leads] === 📊 RESUMO DO PROCESSAMENTO DE LEAD ===", {
      supabase_success: true,
      supabase_lead_id: supabaseResult?.data?.[0]?.id,
      webhook_requested: !!webhookUrl,
      webhook_url: webhookUrl ? webhookUrl.substring(0, 30) + "..." : "não fornecida",
      form_type: filteredData.form_type,
      source: filteredData.source,
      timestamp: new Date().toISOString(),
      message: "Processamento de lead concluído"
    });

    return createSuccessResponse(corsHeaders, {
      leadSaved: true,
      leadId: supabaseResult?.data?.[0]?.id,
      timestamp: new Date().toISOString(),
      env: envStatus,
    })
  } catch (error) {
    console.error("[API:leads] Erro na API:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar lead",
        success: false,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function OPTIONS(request: Request) {
  const headersList = headers()
  const origin = headersList.get("origin") || "*"

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Test-Request",
    },
  })
}

