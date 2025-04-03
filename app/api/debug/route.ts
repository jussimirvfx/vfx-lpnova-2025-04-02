import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const headersList = headers()
  const origin = headersList.get("origin") || "*"

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASELEADS_SUPABASE_URL
    const supabaseKey = process.env.SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY
    const facebookPixelId = process.env.FACEBOOK_PIXEL_ID

    const envStatus = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasFacebookPixelId: !!facebookPixelId,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 8) + "..." : "AUSENTE",
      environment: process.env.NODE_ENV || "unknown",
      timestamp: new Date().toISOString(),
    }

    // Testar conexão com Supabase
    let connectionStatus = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase.from("leads").select("id", { count: "exact" }).limit(1)

      connectionStatus = {
        success: !error,
        error: error
          ? {
              message: error.message,
              code: error.code,
              hint: error.hint,
            }
          : null,
        count: count || 0,
      }
    } catch (error) {
      connectionStatus = {
        success: false,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : "Unknown error",
        count: 0,
      }
    }

    return NextResponse.json(
      {
        success: true,
        environment: envStatus,
        connection: connectionStatus,
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

