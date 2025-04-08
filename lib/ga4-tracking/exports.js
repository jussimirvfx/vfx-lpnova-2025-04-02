"use client";

/**
 * Arquivo de exportação para facilitar o uso das funcionalidades GA4
 * Centraliza todas as exportações relacionadas ao GA4
 */

// Hook principal para usar o GA4 em componentes
export { useGA4 } from './hooks/useGA4';

// Gateway para integração com Meta Pixel
export { useMetaGA4Gateway } from './meta-gateway';

// Componentes para inicialização
export { GA4Initializer } from '../../components/layout/GA4Initializer';
export { MetaGA4Gateway } from '../../components/layout/MetaGA4Gateway';

// Funções diretas para manipulação de dados do usuário
// Para uso em arquivos não-React ou fora de componentes
export {
  setUserId,
  getUserId,
  setUserProperty,
  setUserProperties,
  getUserProperties,
  clearUserData
} from './core/user-data';

// Funções para envio de eventos
export { sendEvent } from './api/send-event';

// Ferramentas de diagnóstico
export { 
  debugGA4Setup, 
  monitorGA4Events,
  showGA4DebugInstructions
} from './debug-helper';

/**
 * Exemplos de uso:
 * 
 * Em componentes React:
 * ```
 * import { useGA4 } from '@/lib/ga4-tracking/exports';
 * 
 * function MeuComponente() {
 *   const { trackEvent, setUserId, setUserProperty } = useGA4();
 *   
 *   useEffect(() => {
 *     // Configurar User ID quando o usuário fizer login
 *     setUserId('user123');
 *     
 *     // Configurar User Properties
 *     setUserProperty('customer_tier', 'premium');
 *   }, []);
 *   
 *   return <button onClick={() => trackEvent('button_click')}>Clique</button>;
 * }
 * ```
 * 
 * Em código não-React:
 * ```
 * import { setUserId, setUserProperty } from '@/lib/ga4-tracking/exports';
 * 
 * // Após o login do usuário
 * setUserId('user123');
 * setUserProperty('customer_tier', 'premium');
 * ```
 *
 * Diagnóstico:
 * ```
 * import { debugGA4Setup, monitorGA4Events } from '@/lib/ga4-tracking/exports';
 * 
 * // Verificar configuração
 * debugGA4Setup();
 * 
 * // Monitorar eventos
 * monitorGA4Events();
 * ```
 */ 