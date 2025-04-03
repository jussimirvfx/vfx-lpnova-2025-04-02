export interface MetaConversionParams {
  event_name: string
  event_time: number
  event_source_url: string
  action_source: string
  event_id: string // ID do evento para deduplicação
  user_data: {
    client_ip_address?: string
    client_user_agent?: string
    em?: string // Email hash
    ph?: string // Phone hash
    fn?: string // First name hash
    ln?: string // Last name hash
    fbc?: string // Click ID
    fbp?: string // Browser ID
  }
  custom_data?: Record<string, any>
  event_source_id?: string
  opt_out?: boolean
}

// Função para gerar um ID de evento único para deduplicação
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Obtém o valor do cookie FBC (Facebook Click ID)
 * Retorna null se não encontrar ou se estiver no servidor
 */
export function getFbc(): string | null {
  if (typeof document === "undefined") return null

  const value = document.cookie.match("(^|;)\\s*_fbc\\s*=\\s*([^;]+)")
  return value ? decodeURIComponent(value[2]) : null
}

/**
 * Obtém o valor do cookie FBP (Facebook Browser ID)
 * Retorna null se não encontrar ou se estiver no servidor
 */
export function getFbp(): string | null {
  if (typeof document === "undefined") return null

  const value = document.cookie.match("(^|;)\\s*_fbp\\s*=\\s*([^;]+)")
  return value ? decodeURIComponent(value[2]) : null
}

import crypto from 'crypto-js';

/**
 * Função para hash de dados pessoais (email, telefone, etc.) usando SHA-256
 * Implementação em conformidade com os requisitos do Meta
 */
export function hashData(data: string): string {
  if (!data || typeof data !== 'string') return '';
  
  try {
    // Normalizar dados (remover espaços, converter para minúsculas)
    const normalizedData = data.trim().toLowerCase();
    
    // Usar crypto-js para criar o hash SHA-256 (método síncrono)
    const hash = crypto.SHA256(normalizedData).toString();
    
    console.log(`[Meta] Hash gerado para dados: ${normalizedData.substring(0, 3)}*** (${hash.substring(0, 8)}...)`);
    
    return hash;
  } catch (error) {
    console.error("[Meta] Erro ao gerar hash:", error);
    
    // Fallback simples para casos onde crypto-js falhar
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      console.warn("[Meta] Usando método de hash fallback");
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data.trim().toLowerCase());
      
      return Array.from(dataBuffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    return '';
  }
}

/**
 * Função para normalizar e fazer hash de email conforme requisitos do Meta
 * Garante que o email seja minúsculo e sem espaços antes do hash
 */
export function normalizeAndHashEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  try {
    // Remover espaços e converter para minúsculas
    const normalizedEmail = email.trim().toLowerCase();
    
    // Aplicar hash
    return hashData(normalizedEmail);
  } catch (error) {
    console.error("[Meta] Erro ao normalizar e gerar hash de email:", error);
    return '';
  }
}

/**
 * Função para normalizar e fazer hash de telefone conforme requisitos do Meta
 * Garante que o telefone tenha apenas números e código do país antes do hash
 */
export function normalizeAndHashPhone(phone: string, countryCode: string = '55'): string {
  if (!phone || typeof phone !== 'string') return '';
  
  try {
    // Remover todos os caracteres não numéricos
    let normalizedPhone = phone.replace(/\D/g, "");
    
    // Adicionar código do país se não estiver presente
    if (!normalizedPhone.startsWith(countryCode)) {
      normalizedPhone = `${countryCode}${normalizedPhone}`;
    }
    
    // Aplicar hash
    return hashData(normalizedPhone);
  } catch (error) {
    console.error("[Meta] Erro ao normalizar e gerar hash de telefone:", error);
    return '';
  }
}

/**
 * Função para normalizar e fazer hash de nome conforme requisitos do Meta
 * Garante que o nome seja minúsculo e sem acentos antes do hash
 */
export function normalizeAndHashName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  try {
    // Remover espaços extras, converter para minúsculas e remover acentos
    const normalizedName = name.trim().toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
    
    // Aplicar hash
    return hashData(normalizedName);
  } catch (error) {
    console.error("[Meta] Erro ao normalizar e gerar hash de nome:", error);
    return '';
  }
}

/**
 * Função aprimorada para preparar os dados do usuário para a API de conversão do Meta
 * Inclui normalização de dados e aplicação de hash quando necessário
 */
export function prepareUserData(formData?: Record<string, any>): Record<string, any> {
  // Dados básicos
  const userData: Record<string, any> = {
    client_ip_address: null,
    client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    fbc: getFbc(),
    fbp: getFbp(),
  }

  // Se tivermos dados do formulário, incluir informações adicionais
  if (formData) {
    if (formData.email) {
      // Hash SHA-256 do email normalizado
      userData.em = normalizeAndHashEmail(formData.email);
    }
    
    if (formData.phone || formData.telefone) {
      // Normalizar telefone para formato internacional e aplicar hash
      const phoneRaw = formData.phone || formData.telefone || "";
      const countryCode = formData.countryCode || '55';
      userData.ph = normalizeAndHashPhone(phoneRaw, countryCode);
    }
    
    if (formData.name || formData.nome) {
      // Nome completo
      const fullName = (formData.name || formData.nome || "");
      userData.fn = normalizeAndHashName(fullName);
      
      // Tentar extrair primeiro e último nome para hash separado se necessário
      const nameParts = fullName.split(' ').filter(Boolean);
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        // Adicionar primeiro e último nome hasheados separadamente
        userData.fn = normalizeAndHashName(firstName);
        userData.ln = normalizeAndHashName(lastName);
      }
    }
    
    // Dados geográficos
    if (formData.city || formData.cidade) {
      userData.ct = (formData.city || formData.cidade || "").trim().toLowerCase();
    }
    
    if (formData.state || formData.estado) {
      userData.st = (formData.state || formData.estado || "").trim().toLowerCase();
    }
    
    if (formData.zip || formData.cep) {
      userData.zp = (formData.zip || formData.cep || "").replace(/\D/g, "");
    }
    
    // External ID se disponível
    if (formData.customer_id || formData.external_id || formData.user_id) {
      const externalId = formData.customer_id || formData.external_id || formData.user_id;
      userData.external_id = hashData(String(externalId));
    }
  }

  return userData;
}

/**
 * Configuração para retentativas de envio para API
 */
const API_RETRY_CONFIG = {
  maxRetries: 3,           // Número máximo de tentativas
  initialDelay: 500,       // Atraso inicial em ms
  maxDelay: 5000,          // Atraso máximo em ms
  factor: 2,               // Fator de backoff
  jitter: true,            // Adicionar variação aleatória aos atrasos
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]  // Códigos de status para retry
};

/**
 * Utilitário para adicionar atraso com backoff exponencial
 * @param attempt Número da tentativa (começando em 0)
 * @returns Tempo em ms para esperar
 */
function getBackoffDelay(attempt: number): number {
  const { initialDelay, maxDelay, factor, jitter } = API_RETRY_CONFIG;
  
  // Calcular atraso com backoff exponencial
  let delay = initialDelay * Math.pow(factor, attempt);
  
  // Aplicar limite máximo
  delay = Math.min(delay, maxDelay);
  
  // Adicionar jitter (variação aleatória) se configurado
  if (jitter) {
    delay = delay * (0.5 + Math.random());
  }
  
  return delay;
}

/**
 * Função para enviar evento para a API de Conversão do Meta com retry automático
 * Usa a rota de API do servidor para evitar problemas de CORS e incluir dados do servidor
 */
export async function sendToMetaConversionApi(params: MetaConversionParams): Promise<boolean> {
  let attempt = 0;
  let lastError: any = null;
  const { maxRetries, retryableStatusCodes } = API_RETRY_CONFIG;
  
  // Se não houver event_id, gere um
  if (!params.event_id) {
    params.event_id = generateEventId();
  }
  
  console.log(`[Meta Conversion API] Preparando envio de ${params.event_name}:`, {
    event_id: params.event_id,
    event_time: new Date(params.event_time * 1000).toISOString(),
    has_fbc: !!params.user_data.fbc,
    has_fbp: !!params.user_data.fbp,
    has_email: !!params.user_data.em,
    has_phone: !!params.user_data.ph,
  });

  while (attempt <= maxRetries) {
    try {
      // Se não é a primeira tentativa, adicionar log
      if (attempt > 0) {
        console.log(`[Meta Conversion API] Tentativa ${attempt+1}/${maxRetries+1} para ${params.event_name}`);
      }
      
      const response = await fetch("/api/meta-conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      // Se a resposta foi bem-sucedida, retorne o resultado
      if (response.ok) {
        const result = await response.json();
        console.log(`[Meta Conversion API] ${params.event_name} enviado com sucesso:`, result);
        return result.success;
      }
      
      const status = response.status;
      const errorText = await response.text();
      lastError = new Error(`HTTP error ${status}: ${errorText}`);
      console.warn(`[Meta Conversion API] Erro HTTP ${status}: ${errorText}`);
      
      // Verificar se o código de status é retryable
      if (!retryableStatusCodes.includes(status)) {
        console.error(`[Meta Conversion API] Código de status ${status} não é retryable, abortando.`);
        break;
      }
      
      // Incrementar tentativa e calcular atraso
      attempt++;
      if (attempt <= maxRetries) {
        const delay = getBackoffDelay(attempt - 1);
        console.log(`[Meta Conversion API] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      console.error(`[Meta Conversion API] Erro de rede ao enviar ${params.event_name}:`, error);
      
      // Incrementar tentativa e calcular atraso
      attempt++;
      if (attempt <= maxRetries) {
        const delay = getBackoffDelay(attempt - 1);
        console.log(`[Meta Conversion API] Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  console.error(`[Meta Conversion API] Falha ao enviar ${params.event_name} após ${attempt} tentativas:`, lastError);
  return false;
}

/**
 * Função para capturar fbclid em links internos
 * Isso ajuda a rastrear cliques em anúncios mesmo com navegação client-side
 */
export function setupFbclidCapture(): void {
  if (typeof window === "undefined") return;

  // Executar apenas uma vez
  if (window.__fbclidCaptureSetup) return;
  window.__fbclidCaptureSetup = true;

  // Adicionar listener para capturar fbclid em navegação client-side
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest("a") as HTMLAnchorElement;

    if (link && link.href && link.href.includes(window.location.hostname)) {
      try {
        const url = new URL(link.href);
        const fbclid = url.searchParams.get("fbclid");

        if (fbclid) {
          // Armazenar o fbclid para uso futuro
          const fbc = `fb.1.${Date.now()}.${fbclid}`;
          document.cookie = `_fbc=${fbc}; path=/; max-age=7776000`; // 90 dias
          localStorage.setItem("_fbc", fbc);
          console.log("[Meta Conversion] FBC capturado de link interno:", fbclid.substring(0, 6) + "...");
        }
      } catch (e) {
        // Ignorar erros de URL inválida
      }
    }
  });

  console.log("[Meta Conversion] Captura de fbclid em links configurada");
}

// Adicionar tipos para window
declare global {
  interface Window {
    __fbclidCaptureSetup?: boolean;
  }
} 