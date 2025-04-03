declare namespace NodeJS {
  interface ProcessEnv {
    FACEBOOK_PIXEL_ID: string
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID: string
    META_API_ACCESS_TOKEN: string
    META_TEST_EVENT_CODE: string
    // Outras variáveis de ambiente existentes...
  }
} 