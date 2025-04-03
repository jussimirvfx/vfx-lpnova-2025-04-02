import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { hashData } from "@/lib/meta-tracking/core/hash-utils";
import { getServerConfig } from "@/lib/meta-tracking/config";

export const runtime = "nodejs";

/**
 * Endpoint para a API de Conversões do Meta
 */
export async function POST(request) {
  const headersList = headers();
  const cookiesList = cookies();
  const origin = headersList.get("origin") || "*";

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // Obter configuração do servidor
    const config = getServerConfig();
    const { PIXEL_ID, ACCESS_TOKEN, TEST_EVENT_CODE } = config;
    
    // Verificar se o token está configurado
    if (!ACCESS_TOKEN) {
      console.error("[Meta Conversion API] Token de acesso não configurado");
      return NextResponse.json(
        { success: false, error: "Token de acesso não configurado" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Obter dados da requisição
    const data = await request.json();

    // Validar dados mínimos
    if (!data.event_name || !data.event_time || !data.user_data) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos para a API de Conversão" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Obter IP e User-Agent
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
    const userAgent = headersList.get("user-agent");
    
    // Dados do usuário enriquecidos
    const userData = {
      ...data.user_data,
      client_ip_address: ip,
      client_user_agent: userAgent,
    };
    
    // Obter external_id do cookie se existir
    const extIdCookie = cookiesList.get('_vfx_extid');
    if (extIdCookie?.value) {
      userData.external_id = hashData(extIdCookie.value);
    }

    // Payload para a API do Meta
    const payload = {
      data: [
        {
          ...data,
          user_data: userData,
          event_id: data.event_id || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        }
      ],
      access_token: ACCESS_TOKEN,
      test_event_code: TEST_EVENT_CODE
    };

    // URL da API do Meta
    const apiUrl = `https://graph.facebook.com/v17.0/${PIXEL_ID}/events`;
    
    // Enviar para a API do Meta
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Processar resposta
    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Meta Conversion API] Erro:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao enviar para API de Conversão",
          details: responseData,
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    console.log("[Meta Conversion API] Evento enviado com sucesso:", {
      event_name: data.event_name,
      event_id: payload.data[0].event_id,
    });

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        event_name: data.event_name,
        event_id: payload.data[0].event_id,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Meta Conversion API] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500, headers: corsHeaders }
    );
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
  });
} 