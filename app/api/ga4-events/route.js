import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/ga4-tracking/config';

/**
 * URL base da API do Measurement Protocol do GA4
 */
const MEASUREMENT_PROTOCOL_API = 'https://www.google-analytics.com/mp/collect';

/**
 * Endpoint para enviar eventos para o GA4 usando o Measurement Protocol
 * @param {Object} request - Requisição HTTP
 * @returns {Promise<NextResponse>} Resposta HTTP
 */
export async function POST(request) {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Obter configurações do servidor
    const config = getServerConfig();
    const { MEASUREMENT_ID, API_SECRET } = config;

    // Validar configurações
    if (!MEASUREMENT_ID || !API_SECRET) {
      console.error('GA4 Measurement Protocol: Configuração incompleta', {
        hasMeasurementId: !!MEASUREMENT_ID,
        hasApiSecret: !!API_SECRET
      });
      
      return NextResponse.json(
        { success: false, error: 'Configuração de GA4 incompleta no servidor' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { eventName, params, clientId, userId, userProperties } = data;

    // Validar dados essenciais
    if (!eventName || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos (eventName ou clientId ausentes)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Enriquecer dados com informações do servidor
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = getClientIP(request);

    // Preparar payload para o Measurement Protocol
    const payload = {
      client_id: clientId,
      events: [{
        name: eventName,
        params: {
          ...params,
          user_agent: userAgent,
          ip: ipAddress
        }
      }]
    };
    
    // Adicionar user_id se disponível
    if (userId) {
      payload.user_id = userId;
    }
    
    // Adicionar user_properties se disponíveis
    if (userProperties && Object.keys(userProperties).length > 0) {
      payload.user_properties = userProperties;
    }

    // URL completa com API key
    const url = `${MEASUREMENT_PROTOCOL_API}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;
    
    // Fazer a requisição para o GA4
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Verificar resposta
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GA4 Measurement Protocol: Erro na requisição', {
        status: response.status,
        error: errorText,
        event: eventName
      });
      
      return NextResponse.json(
        { success: false, error: `Erro na API do GA4: ${response.status}` },
        { status: 502, headers: corsHeaders }
      );
    }

    // Registrar envio bem-sucedido
    console.log(`GA4 Measurement Protocol: Evento ${eventName} enviado com sucesso`);
    
    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('GA4 Measurement Protocol: Erro interno', {
      error: error.message
    });
    
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handlers para requisições OPTIONS (CORS preflight)
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

/**
 * Obtém o IP do cliente a partir da requisição
 * @param {Object} request - Requisição HTTP
 * @returns {string} Endereço IP do cliente
 */
function getClientIP(request) {
  // Tentar obter o IP real de headers comuns em ambientes com proxy
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  // Retornar o primeiro IP válido encontrado
  if (forwarded) {
    // x-forwarded-for pode conter múltiplos IPs separados por vírgula
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback para IP desconhecido
  return '0.0.0.0';
} 