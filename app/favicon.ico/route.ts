import { NextResponse } from "next/server"

export async function GET() {
  // Redirect to the favicon hosted on Vercel Blob storage
  return NextResponse.redirect(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-32x32-gbAVH2XL09hRJMKPelfnpBKsOrL2ey.png",
  )
}

