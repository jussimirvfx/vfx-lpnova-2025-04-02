// Declaração para a função gtag global
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
} 