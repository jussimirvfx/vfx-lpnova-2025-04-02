import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Log das variáveis de ambiente (mascaradas)
const supabaseUrl = process.env.SUPABASELEADS_SUPABASE_URL
const supabaseKey = process.env.SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY

console.log("[Supabase] Inicializando cliente Supabase com as seguintes variáveis de ambiente:")
console.log("[Supabase] SUPABASELEADS_SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : "AUSENTE")
console.log("[Supabase] SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "PRESENTE (mascarado)" : "AUSENTE")
console.log("[Supabase] NODE_ENV:", process.env.NODE_ENV)

// Validar variáveis de ambiente
if (!supabaseUrl || !supabaseKey) {
  console.error("[Supabase] Variáveis de ambiente do Supabase ausentes:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })

  // Em vez de lançar um erro, vamos criar um cliente com valores vazios
  // para evitar que a aplicação quebre completamente
  if (process.env.NODE_ENV === "production") {
    console.error("[Supabase] ALERTA CRÍTICO: Variáveis de ambiente ausentes em produção!")
  }
}

// Criar cliente com configurações otimizadas
export const supabase = createClient<Database>(
  supabaseUrl || "https://example.supabase.co", // Fallback para evitar erro
  supabaseKey || "invalid-key", // Fallback para evitar erro
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "leads-form",
        "x-application-name": "vfx-landing-page",
      },
    },
    // Adicionar configurações para melhor performance
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    // Configurações de retry e timeout
    request: {
      timeout: 20000,
      retryAttempts: 3,
      retryInterval: 1000,
    },
  },
)

// Testar conexão imediatamente
console.log("[Supabase] Testando conexão com o Supabase...")
supabase
  .from("leads")
  .select("id")
  .limit(1)
  .then((result) => {
    if (result.error) {
      throw result.error
    }
    console.log("[Supabase] ✅ Conexão com o Supabase bem-sucedida")
  })
  .catch((error) => {
    console.error("[Supabase] ❌ Erro na conexão com o Supabase:", {
      error,
      message: error.message,
      hint: error.hint,
      details: error.details,
      code: error.code,
      timestamp: new Date().toISOString(),
    })
  })

