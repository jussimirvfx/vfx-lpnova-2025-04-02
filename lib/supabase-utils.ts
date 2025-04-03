import { supabase } from "./supabase"

export async function testSupabaseConnection(): Promise<boolean> {
  console.log("Testing Supabase connection...")

  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      url: !!process.env.SUPABASELEADS_SUPABASE_URL,
      key: !!process.env.SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY,
    }

    console.log("Environment variables check:", envCheck)

    if (!envCheck.url || !envCheck.key) {
      console.error("Missing Supabase environment variables:", {
        hasUrl: envCheck.url,
        hasKey: envCheck.key,
      })
      throw new Error("Missing Supabase environment variables")
    }

    // Testar conexão com timeout
    const timeoutMs = 5000
    console.log(`Setting connection timeout to ${timeoutMs}ms`)

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
    })

    console.log("Attempting to query Supabase 'leads' table...")
    const queryPromise = supabase
      .from("leads")
      .select("id")
      .limit(1)
      .then((result) => {
        if (result.error) {
          console.error("Query error:", result.error)
          throw result.error
        }
        console.log("Query successful, received data:", {
          hasData: !!result.data,
          count: result.data?.length || 0,
        })
        return result
      })

    await Promise.race([queryPromise, timeoutPromise])

    console.log("✅ Supabase connection test successful")
    return true
  } catch (error) {
    console.error("❌ Supabase connection test failed:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasUrl: !!process.env.SUPABASELEADS_SUPABASE_URL,
        hasKey: !!process.env.SUPABASELEADS_SUPABASE_SERVICE_ROLE_KEY,
      },
    })
    return false
  }
}

// Função auxiliar para verificar o schema do Supabase
export async function checkSupabaseSchema(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("leads").select("id").limit(1)

    if (error) {
      console.error("Schema check error:", error)
      return false
    }

    console.log("Schema check successful:", {
      hasData: !!data,
      tableExists: true,
    })

    return true
  } catch (error) {
    console.error("Schema check failed:", error)
    return false
  }
}

