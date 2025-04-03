"use client"

import { createContext, useContext, ReactNode } from "react"
import { useMetaPixel } from "@/lib/hooks/use-meta-pixel"

// Interface para o contexto
interface MetaPixelContextType {
  isInitialized: boolean
  trackEvent: (
    eventName: string, 
    params?: Record<string, any>, 
    options?: { eventID?: string }
  ) => string | undefined
}

// Valores padrão para o contexto
const defaultContext: MetaPixelContextType = {
  isInitialized: false,
  trackEvent: () => undefined,
}

// Criar o contexto
const MetaPixelContext = createContext<MetaPixelContextType>(defaultContext)

// Props do Provider
interface MetaPixelProviderProps {
  children: ReactNode
}

/**
 * Provider que disponibiliza as funções do Meta Pixel para toda a aplicação
 */
export function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  // Usar o hook do Meta Pixel
  const metaPixel = useMetaPixel()
  
  return (
    <MetaPixelContext.Provider value={metaPixel}>
      {children}
    </MetaPixelContext.Provider>
  )
}

/**
 * Hook para acessar o contexto do Meta Pixel
 */
export function useMetaPixelContext() {
  return useContext(MetaPixelContext)
} 