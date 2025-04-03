import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

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
      timestamp: Date.now(),
    }

    // Criar resposta com os dados
    const response = NextResponse.next()

    // Definir cookie httpOnly com os dados
    response.cookies.set('__meta_data', JSON.stringify(trackingData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hora
      path: '/',
    })

    // Log para debug (redatando dados sensíveis)
    const logData = {
      ...trackingData,
      ip: '***',
      ua: '[REDACTED]',
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