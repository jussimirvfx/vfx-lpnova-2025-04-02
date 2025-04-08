/**
 * API Route para o GA4 Measurement Protocol
 */

import { NextRequest, NextResponse } from 'next/server';
import { GA4_CONFIG } from '@/lib/ga4-tracking/config/ga4-config';

export async function POST(request: NextRequest) {
  // Verificar se as configurações necessárias estão presentes
  if (!GA4_CONFIG.MEASUREMENT_ID || !GA4_CONFIG.API_SECRET) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] API - Configurações incompletas`)
    return NextResponse.json(
      { error: 'GA4 não está configurado corretamente' },
      { status: 500 }
    );
  }
  
  try {
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { event_name, client_id, params = {} } = body;
    
    // Validar parâmetros obrigatórios
    if (!event_name) {
      return NextResponse.json(
        { error: 'event_name é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id é obrigatório' },
        { status: 400 }
      );
    }
    
    // Preparar o endpoint
    const endpoint = process.env.NODE_ENV === 'development' && GA4_CONFIG.LOGGING.ENABLED
      ? GA4_CONFIG.DEBUG_ENDPOINT
      : GA4_CONFIG.MEASUREMENT_PROTOCOL_ENDPOINT;
      
    const url = `${endpoint}?measurement_id=${GA4_CONFIG.MEASUREMENT_ID}&api_secret=${GA4_CONFIG.API_SECRET}`;
    
    // Preparar o payload
    const payload = {
      client_id,
      events: [
        {
          name: event_name,
          params: {
            ...params,
            engagement_time_msec: 100,
          }
        }
      ],
      timestamp_micros: Date.now() * 1000,
    };
    
    // Log para debugging
    console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] API - Enviando evento ${event_name} via MP`, {
      clientId: client_id.substring(0, 5) + '...',
      hasParams: Object.keys(params).length,
      endpoint: endpoint === GA4_CONFIG.DEBUG_ENDPOINT ? 'DEBUG' : 'PROD',
    });
    
    // Enviar a requisição para o GA4
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    
    // Processar resposta
    let responseData;
    try {
      responseData = await response.text();
    } catch (e) {
      responseData = 'Sem dados na resposta';
    }
    
    if (!response.ok) {
      console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] API - Erro ao enviar evento para MP:`, {
        status: response.status,
        responseData
      });
      
      return NextResponse.json(
        { 
          error: 'Erro ao enviar evento para o GA4',
          details: responseData 
        },
        { status: response.status }
      );
    }
    
    // Log de sucesso
    console.log(`[${GA4_CONFIG.LOGGING.PREFIX}] API - Evento enviado com sucesso:`, {
      event_name,
      response: responseData.substring(0, 50) + (responseData.length > 50 ? '...' : '')
    });
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true,
      event: event_name,
      debugResponse: process.env.NODE_ENV === 'development' ? responseData : undefined
    });
  } catch (error) {
    console.error(`[${GA4_CONFIG.LOGGING.PREFIX}] API - Erro ao processar requisição:`, error);
    
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição', details: String(error) },
      { status: 500 }
    );
  }
} 