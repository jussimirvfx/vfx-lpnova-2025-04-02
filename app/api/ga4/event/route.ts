import { NextRequest, NextResponse } from 'next/server';

// Endpoint do Google Measurement Protocol v2
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const API_SECRET = process.env.GA4_API_SECRET;
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export async function POST(req: NextRequest) {
  if (!API_SECRET || !MEASUREMENT_ID) {
    console.error('GA4 MP API: Variáveis de ambiente GA4_API_SECRET ou NEXT_PUBLIC_GA4_MEASUREMENT_ID não definidas.');
    return NextResponse.json({ message: 'Configuração do servidor incompleta.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { client_id, user_properties, non_personalized_ads, events } = body;

    // Validação básica
    if (!client_id || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ message: 'Dados inválidos: client_id e events são obrigatórios.' }, { status: 400 });
    }

    // Constrói a URL com os parâmetros necessários
    const url = `${GA4_ENDPOINT}?api_secret=${API_SECRET}&measurement_id=${MEASUREMENT_ID}`;

    // Prepara o payload final para o Google
    const payload = {
      client_id,
      non_personalized_ads: non_personalized_ads === undefined ? false : non_personalized_ads, // Default false
      user_properties,
      events,
    };

    // Adiciona informações da requisição original se útil (ex: IP, User-Agent)
    // ATENÇÃO: Cuidado com dados sensíveis e privacidade (GDPR, LGPD).
    // O Measurement Protocol NÃO coleta IP/User-Agent automaticamente.
    // Se precisar deles para atribuição/geolocalização, considere enviar como parâmetros.
    // Exemplo (não recomendado coletar IP diretamente sem consentimento explícito):
    // const ip = req.ip || req.headers.get('x-forwarded-for');
    // const userAgent = req.headers.get('user-agent');
    // if (ip) payload.events[0].params.ip_override = ip;
    // if (userAgent) payload.events[0].params.user_agent_override = userAgent;

    console.log('GA4 MP API: Enviando payload para Google:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // O Measurement Protocol retorna 204 No Content em caso de sucesso.
    // Qualquer outra resposta indica um problema.
    if (response.status === 204) {
      console.log('GA4 MP API: Evento enviado com sucesso para o Google.');
      return NextResponse.json({ message: 'Evento recebido com sucesso.' }, { status: 200 }); // Retorna 200 para o nosso cliente
    } else {
      const errorBody = await response.text();
      console.error(`GA4 MP API: Google respondeu com erro ${response.status}:`, errorBody);
      // Retornar o erro do Google pode expor detalhes internos, seja cuidadoso
      return NextResponse.json({ message: `Erro ao enviar para o Google: ${response.status}`, error: errorBody }, { status: response.status });
    }
  } catch (error: any) {
    console.error('GA4 MP API: Erro interno no servidor:', error);
    return NextResponse.json({ message: 'Erro interno no servidor', error: error.message }, { status: 500 });
  }
} 