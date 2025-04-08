// Chaves usadas no localStorage/sessionStorage
const GA4_EVENT_PREFIX = 'ga4_event_';

// Função para marcar um evento como enviado para o usuário atual
export const markEventAsSent = (eventName: string, uniqueIdentifier?: string): void => {
  try {
    const key = `${GA4_EVENT_PREFIX}${eventName}${uniqueIdentifier ? `_${uniqueIdentifier}` : ''}`;
    // Usar sessionStorage para eventos que devem ser prevenidos apenas na sessão atual
    // Usar localStorage para eventos que devem ser prevenidos por mais tempo
    if (eventName === 'page_view') {
        sessionStorage.setItem(key, Date.now().toString()); // Prevenir page_view duplicado na mesma sessão/página
    } else {
        localStorage.setItem(key, Date.now().toString()); // Prevenir outros eventos como lead, sign_up, etc.
    }
  } catch (error) {
    console.warn('Não foi possível gravar no Storage:', error);
  }
};

// Função para verificar se um evento já foi enviado
// Retorna true se já foi enviado, false caso contrário
export const hasEventBeenSent = (eventName: string, uniqueIdentifier?: string): boolean => {
  try {
    const key = `${GA4_EVENT_PREFIX}${eventName}${uniqueIdentifier ? `_${uniqueIdentifier}` : ''}`;
    const timestamp = eventName === 'page_view' ? sessionStorage.getItem(key) : localStorage.getItem(key);

    if (!timestamp) {
      return false;
    }

    // Opcional: adicionar lógica de expiração se necessário
    // const expirationTime = 24 * 60 * 60 * 1000; // Exemplo: 24 horas
    // if (Date.now() - parseInt(timestamp, 10) > expirationTime) {
    //   localStorage.removeItem(key); // Remove se expirado
    //   return false;
    // }

    return true;
  } catch (error) {
    console.warn('Não foi possível ler do Storage:', error);
    return false; // Assume que não foi enviado em caso de erro
  }
}; 