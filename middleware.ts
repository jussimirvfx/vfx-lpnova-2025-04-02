import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

// Nome do cookie para o external_id
const EXTERNAL_ID_COOKIE_NAME = '_vfx_extid'

// Rotas que não precisam do middleware
const EXCLUDED_PATHS = [
  '/api/health',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

// Função para verificar se a rota deve ser excluída
function shouldExcludePath(pathname: string): boolean {
  return EXCLUDED_PATHS.some(path => pathname.startsWith(path))
}

// Função para obter o IP real do cliente
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || request.ip || ''
}

// Função para obter o User Agent
function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || ''
}

// Função para obter dados de geolocalização
function getGeoData(request: NextRequest) {
  const geo = request.geo || {}
  return {
    country: geo.country || '',
    city: geo.city || '',
    region: geo.region || '',
  }
}

// Função para obter cookies do Meta Pixel
function getMetaCookies(request: NextRequest) {
  const fbp = request.cookies.get('_fbp')?.value
  const fbc = request.cookies.get('_fbc')?.value
  return { fbp, fbc }
}

export async function middleware(request: NextRequest) {
  // Verificar se a rota deve ser excluída
  if (shouldExcludePath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  try {
    // Obter ou gerar um external_id para o visitante
    let externalId = request.cookies.get(EXTERNAL_ID_COOKIE_NAME)?.value
    const isNewUser = !externalId
    
    if (!externalId) {
      externalId = uuidv4()
      console.log(`[Meta Middleware] Novo external_id gerado: ${externalId.substring(0, 8)}...`);
    }

    // Capturar dados do usuário
    const ip = getClientIp(request)
    const ua = getUserAgent(request)
    const geo = getGeoData(request)
    const { fbp, fbc } = getMetaCookies(request)

    // Preparar dados para armazenar
    const trackingData = {
      ip,
      ua,
      geo,
      fbp,
      fbc,
      external_id: externalId,
      timestamp: Date.now(),
    }

    // Criar resposta com os dados
    const response = NextResponse.next()
    
    // Definir/atualizar o cookie de external_id para identificação persistente
    if (isNewUser) {
      response.cookies.set({
        name: EXTERNAL_ID_COOKIE_NAME,
        value: externalId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 ano
        path: '/',
      })
    }

    // Definir cookie httpOnly com os dados gerais de rastreamento
    response.cookies.set('__meta_data', JSON.stringify(trackingData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hora
      path: '/',
    })

    // Incluir o external_id em um header específico para facilitar o acesso
    response.headers.set('x-external-id', externalId)

    // Log para debug (redatando dados sensíveis)
    const logData = {
      ...trackingData,
      ip: '***',
      ua: '[REDACTED]',
      external_id: `${externalId.substring(0, 8)}...`,
    }
    console.log('[Meta Middleware] Dados capturados:', logData)

    return response
  } catch (error) {
    console.error('[Meta Middleware] Erro:', error)
    return NextResponse.next()
  }
}

// Configurar em quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/health (health check)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /robots.txt (SEO file)
     * 6. /sitemap.xml (SEO file)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
} 