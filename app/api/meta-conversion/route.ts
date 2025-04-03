import { NextResponse } from "next/server"
import { headers, cookies } from "next/headers"
import { validateFbc, hashData } from "@/lib/meta-utils"
import { META_PIXEL_CONFIG } from "@/lib/config/meta-pixel"

export const runtime = "nodejs"

/**
 * Interface que define os dados de rastreamento
 * Estes dados são coletados pelo middleware e armazenados em um cookie
 */
interface TrackingData {
  ip?: string;
  ua?: string;
  fbp?: string; 
  fbc?: string;
  timestamp?: number;
  external_id?: string;
  geo?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

// Configurações da API de Conversão do Meta
const META_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID || "627212412327362"
const META_ACCESS_TOKEN = process.env.META_API_ACCESS_TOKEN || ""
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "TEST57043"

/**
 * Endpoint da API de Conversão do Meta
 * 
 * Este endpoint recebe eventos do cliente e os envia para a API de Conversão do Meta.
 * IMPORTANTE: Conforme documentação do Meta, apenas os seguintes campos devem ser incluídos em user_data:
 * - client_ip_address
 * - client_user_agent
 * - em (email hasheado)
 * - ph (telefone hasheado)
 * - fn (primeiro nome hasheado)
 * - ln (sobrenome hasheado)
 * - db (data de nascimento hasheada)
 * - ge (gênero hasheado)
 * - ct (cidade hasheada) - NÃO ENVIE DIRETAMENTE, DEVE SER HASHEADO
 * - st (estado hasheado) - NÃO ENVIE DIRETAMENTE, DEVE SER HASHEADO
 * - zp (CEP hasheado)
 * - country (país hasheado)
 * - external_id (ID do cliente hasheado)
 * - fbc (cookie fbc)
 * - fbp (cookie fbp)
 */
export async function POST(request: Request) {
  const headersList = headers()
  const cookiesList = cookies()
  const origin = headersList.get("origin") || "*"

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    // Verificar se o token de acesso está configurado
    if (!META_ACCESS_TOKEN) {
      console.error("[Meta Conversion API] Token de acesso não configurado")
      return NextResponse.json(
        { success: false, error: "Token de acesso não configurado" },
        { status: 500, headers: corsHeaders },
      )
    }

    // Obter dados do corpo da requisição
    const data = await request.json()

    // Validar dados mínimos necessários
    if (!data.event_name || !data.event_time || !data.user_data) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos para a API de Conversão" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Obter dados do cookie httpOnly definido pelo middleware
    const metaData = cookiesList.get('__meta_data')
    let trackingData: TrackingData = {}
    
    if (metaData) {
      try {
        trackingData = JSON.parse(metaData.value) as TrackingData
      } catch (e) {
        console.error('[Meta API] Erro ao parsear dados de rastreamento:', e)
      }
    }

    // Verificar se é um evento PageView e adicionar tratamento especial
    const isPageView = data.event_name === "PageView"

    // Remover o test_event_code dos dados enviados pelo cliente
    const { test_event_code: _, ...cleanData } = data;

    // Obter external_id do cookie ou do header
    let externalId = trackingData.external_id
    if (!externalId) {
      // Tentar obter do cookie diretamente
      externalId = cookiesList.get('_vfx_extid')?.value
      
      if (externalId) {
        console.log('[Meta Conversion API] Obteve external_id do cookie: ' + externalId.substring(0, 8) + '...');
      } else {
        // Tentar obter do header (definido pelo middleware)
        externalId = headersList.get('x-external-id') || undefined
        if (externalId) {
          console.log('[Meta Conversion API] Obteve external_id do header: ' + externalId.substring(0, 8) + '...');
        }
      }
    } else {
      console.log('[Meta Conversion API] Obteve external_id dos dados de tracking: ' + externalId.substring(0, 8) + '...');
    }

    // Preparar os dados do usuário com informações do servidor
    const userData = {
      ...cleanData.user_data,
      client_ip_address: trackingData.ip || headersList.get("x-forwarded-for") || headersList.get("x-real-ip"),
      client_user_agent: trackingData.ua || headersList.get("user-agent"),
    }
    
    // Adicionar external_id hasheado se disponível
    if (externalId) {
      userData.external_id = hashData(externalId)
    }

    // Fallback: Tentar obter fbp diretamente do cookie se não veio no payload
    if (!userData.fbp) {
      const fbpCookie = cookiesList.get('_fbp');
      if (fbpCookie) {
        console.log('[Meta Conversion API] Fallback: Usando _fbp do cookie.');
        userData.fbp = fbpCookie.value;
      }
    }

    // Verificar qualidade dos dados
    const userDataQuality = {
      hasFbc: !!userData.fbc,
      hasFbp: !!userData.fbp,
      hasEmail: !!userData.em,
      hasPhone: !!userData.ph,
      hasIp: !!userData.client_ip_address,
      hasUserAgent: !!userData.client_user_agent,
      hasFirstName: !!userData.fn,
    };
    
    const dataQualityScore = Object.values(userDataQuality).filter(Boolean).length;
    
    console.log(`[Meta Conversion API] Qualidade dos dados (${dataQualityScore}/7):`, userDataQuality);

    // Preparar payload para a API
    const payload = {
      data: [
        {
          ...cleanData,
          user_data: userData,
          event_id: cleanData.event_id || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        }
      ],
      access_token: META_ACCESS_TOKEN,
      test_event_code: TEST_EVENT_CODE
    };

    // Log para debug (com dados sensíveis redatados)
    const payloadForLog = JSON.parse(JSON.stringify(payload));
    payloadForLog.access_token = payloadForLog.access_token ? `${payloadForLog.access_token.substring(0, 4)}...${payloadForLog.access_token.substring(payloadForLog.access_token.length - 4)}` : undefined;
    if (payloadForLog.data[0].user_data) {
      payloadForLog.data[0].user_data = {
        ...payloadForLog.data[0].user_data,
        client_ip_address: "***",
        em: payloadForLog.data[0].user_data.em ? "[HASH]" : undefined,
        ph: payloadForLog.data[0].user_data.ph ? "[HASH]" : undefined,
      }
    }
    console.log("[Meta Conversion API] Payload:", JSON.stringify(payloadForLog, null, 2))

    // URL da API de Conversão do Meta
    const apiUrl = `https://graph.facebook.com/v17.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`;
    
    // Enviar para a API de Conversão do Meta
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Processar resposta
    const responseData = await response.json()

    if (!response.ok) {
      console.error("[Meta Conversion API] Erro na resposta:", responseData)
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao enviar para API de Conversão",
          details: responseData,
          status_code: response.status,
        },
        { status: response.status, headers: corsHeaders },
      )
    }

    console.log("[Meta Conversion API] Evento enviado com sucesso:", {
      event_name: cleanData.event_name,
      event_id: payload.data[0].event_id,
      response: responseData
    })

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        event_name: cleanData.event_name,
        event_id: payload.data[0].event_id,
        test_event_code: payload.test_event_code,
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error("[Meta Conversion API] Erro:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  })
}

