interface Window {
  openPresentationModal?: () => void
  fbq?: (
    action: string,
    event: string,
    params?: {
      [key: string]: any
    },
  ) => void
  _fbq?: any
  _fbPixelInitialized?: boolean
  trackFBEvent?: (event: string, params?: any) => boolean
}

