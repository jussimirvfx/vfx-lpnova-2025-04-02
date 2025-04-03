import { NextResponse } from "next/server"
import { headers } from "next/headers"

export const runtime = "nodejs"

// Helper function to validate webhook URL
function isValidWebhookUrl(url: string) {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  // Get origin for CORS
  const headersList = headers()
  const origin = headersList.get("origin") || "*"

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  try {
    const data = await request.json()
    const { webhookUrl, ...payload } = data

    // Validate webhook URL
    if (!webhookUrl || !isValidWebhookUrl(webhookUrl)) {
      console.error("Invalid webhook URL:", webhookUrl)
      return NextResponse.json({ success: false, error: "Invalid webhook URL" }, { status: 400, headers: corsHeaders })
    }

    // Add timestamp and clean payload
    const cleanPayload = {
      ...payload,
      created_at: new Date().toISOString(),
    }

    // Send to webhook with retry logic
    let attempt = 0
    const maxRetries = 3
    let lastError = null

    while (attempt < maxRetries) {
      try {
        console.log(`Webhook attempt ${attempt + 1}/${maxRetries} to ${webhookUrl}`)

        const controller = new AbortController()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            controller.abort()
            reject(new Error("Request timeout"))
          }, 10000)
        })

        const fetchPromise = fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "VFX-Webhook/1.0",
          },
          body: JSON.stringify(cleanPayload),
          signal: controller.signal,
        })

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise])

        // Get response text for logging
        const responseText = await response.text()
        console.log("Webhook response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          headers: Object.fromEntries(response.headers.entries()),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} body: ${responseText}`)
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders })
      } catch (error) {
        lastError = error
        console.error("Webhook attempt failed:", {
          attempt: attempt + 1,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          webhookUrl,
        })

        if (attempt === maxRetries - 1) {
          return NextResponse.json(
            {
              success: false,
              error: `Webhook failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            { status: 500, headers: corsHeaders },
          )
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        attempt++
      }
    }

    throw lastError || new Error("Max retries exceeded")
  } catch (error) {
    console.error("Webhook processing error:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error processing webhook",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  })
}

