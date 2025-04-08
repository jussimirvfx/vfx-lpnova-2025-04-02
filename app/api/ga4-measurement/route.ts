import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getServerGA4Config } from '@/lib/config/ga4'
import { GA4TrackingData } from '@/lib/types'

// URL base da API do Measurement Protocol do GA4
const GA4_MEASUREMENT_PROTOCOL_URL = 'https://www.google-analytics.com/mp/collect'

// Headers para permitir CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Método OPTIONS para responder preflight
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Obter configuração do GA4 do servidor
const serverConfig = getServerGA4Config();
const GA4_MEASUREMENT_ID = serverConfig.MEASUREMENT_ID;
const GA4_API_SECRET = serverConfig.API_SECRET;

// Log detalhado das variáveis para diagnóstico
console.log('==================== DIAGNÓSTICO DE VARIÁVEIS GA4 (SERVIDOR) ====================');
console.log('NEXT_PUBLIC_GA4_MEASUREMENT_ID status:', GA4_MEASUREMENT_ID ? 'Configurado' : 'Não configurado');
console.log('GA4_API_SECRET status:', GA4_API_SECRET ? 'Configurado' : 'Não configurado');
console.log('===================================================================');

/**
 * Endpoint para enviar eventos para o GA4 via Measurement Protocol
 * Permite enviar eventos do servidor com dados adicionais como IP
 */
export async function POST(request: Request) {
  const headersList = headers()
  const cookiesList = cookies()
  const origin = headersList.get('origin') || '*'

  // Atualizar CORS headers com origem específica
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Verificar se o API Secret está configurado
    if (!GA4_API_SECRET) {
      console.error("[GA4 Measurement API] API Secret não configurado")
      return NextResponse.json(
        { success: false, error: "API Secret não configurado" },
        { status: 500, headers: corsHeaders },
      )
    }

    // Obter dados do corpo da requisição
    const data = await request.json()

    // Validar dados mínimos necessários
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: "Nome do evento não fornecido" },
        { status: 400, headers: corsHeaders },
      )
    }

    // Obter dados do cookie se disponível
    const ga4Data = cookiesList.get('__ga4_data')
    let trackingData: GA4TrackingData = {}
    
    if (ga4Data) {
      try {
        trackingData = JSON.parse(ga4Data.value) as GA4TrackingData
      } catch (e) {
        console.error('[GA4 API] Erro ao parsear dados de rastreamento:', e)
      }
    }

    // Obter IP e User-Agent
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '0.0.0.0'
    const userAgent = headersList.get('user-agent') || ''

    // Obter ou gerar client_id
    const clientId = data.client_id || trackingData.client_id || generateClientId()

    // Preparar os parâmetros para o evento
    const eventParams = {
      ...data.params,
      ip: ip,
      user_agent: userAgent,
    }

    // Montar o payload para o GA4
    const payload = {
      client_id: clientId,
      events: [
        {
          name: data.name,
          params: eventParams
        }
      ],
      user_id: trackingData.user_id || data.user_id,
      timestamp_micros: data.timestamp_micros || Date.now() * 1000,
      non_personalized_ads: data.non_personalized_ads
    }

    // Construir a URL para o endpoint do GA4
    const url = `${GA4_MEASUREMENT_PROTOCOL_URL}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`

    // Log do evento que será enviado
    console.log(`[GA4 Measurement API] Enviando evento '${data.name}'`, {
      clientId,
      hasUserId: !!payload.user_id,
      ip,
      params: Object.keys(eventParams)
    })

    // Enviar para o GA4
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // Verificar resposta
    if (!response.ok) {
      const responseText = await response.text()
      console.error(`[GA4 Measurement API] Erro ao enviar evento: ${response.status}`, responseText)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro na API do GA4: ${response.status}`,
          details: responseText
        },
        { status: response.status, headers: corsHeaders },
      )
    }

    // Resposta de sucesso
    return NextResponse.json(
      { 
        success: true, 
        message: `Evento '${data.name}' enviado com sucesso para o GA4`,
        clientId
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error('[GA4 Measurement API] Erro:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

/**
 * Gera um Client ID no formato do GA4
 */
function generateClientId(): string {
  return `GA1.1.${Math.floor(Math.random() * 2147483647)}.${Math.floor(Date.now() / 1000)}`
} 