interface Window {
  // Meta Pixel
  fbq?: (...args: any[]) => void;
  _fbq?: any;
  fbevents?: any;
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
  
  // Propriedades para funções personalizadas Meta/FB
  sendMetaEvent?: (eventName: string, eventParams?: any, options?: any) => void;
  trackFBEvent?: (eventName: string, params?: any) => void;
  generateEventId?: () => string;

  // Propriedades para GA4
  previousPath?: string;
  trackRouteChange?: (url: string) => void;
} 