/**
 * API route para debug de conexões
 * Para verificar o funcionamento do GA4 e suas variáveis
 */

import { NextRequest, NextResponse } from 'next/server';
import { GA4_CONFIG } from '@/lib/ga4-tracking/config/ga4-config';

export async function GET(request: NextRequest) {
  // Verificar as configurações do GA4
  const ga4Config = {
    MEASUREMENT_ID: GA4_CONFIG.MEASUREMENT_ID ? 'Configurado' : 'Não configurado',
    API_SECRET: GA4_CONFIG.API_SECRET ? 'Configurado (valor não exibido)' : 'Não configurado',
    DEBUG_ENDPOINT: GA4_CONFIG.DEBUG_ENDPOINT,
    LOGGING_ENABLED: GA4_CONFIG.LOGGING.ENABLED,
  };
  
  // Verificar configurações de segurança/ambiente
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'não definido',
    IS_LOCAL_DEVELOPMENT: process.env.NODE_ENV === 'development',
  };
  
  // Testar a conexão com o GA4 Measurement Protocol
  let ga4ConnectionTest = { success: false, message: 'Não testado' };
  
  if (GA4_CONFIG.MEASUREMENT_ID && GA4_CONFIG.API_SECRET) {
    try {
      // Endpoint de validação
      const validationUrl = `${GA4_CONFIG.DEBUG_ENDPOINT}?measurement_id=${GA4_CONFIG.MEASUREMENT_ID}&api_secret=${GA4_CONFIG.API_SECRET}`;
      
      // Payload de teste
      const testPayload = {
        client_id: 'debug-client-id.123456789',
        events: [
          {
            name: 'debug_event',
            params: {
              debug_mode: true,
              timestamp: Date.now(),
            }
          }
        ]
      };
      
      // Enviar requisição de teste
      const response = await fetch(validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
      });
      
      // Verificar resposta
      const data = await response.text();
      
      ga4ConnectionTest = {
        success: response.ok,
        message: response.ok ? 'Conexão bem-sucedida' : 'Falha na conexão',
        status: response.status,
        responseData: data.substring(0, 500) // Limitar tamanho da resposta
      };
    } catch (error) {
      ga4ConnectionTest = {
        success: false,
        message: 'Erro ao testar conexão',
        error: String(error)
      };
    }
  }
  
  // Retornar resultados
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ga4Config,
    env,
    ga4ConnectionTest
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

