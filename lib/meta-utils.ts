import crypto from 'crypto-js';

interface MetaParams {
  fbc?: string;
  fbp?: string;
}

export function getMetaParams(): MetaParams {
  const params: MetaParams = {};

  // Tentar obter fbc do cookie _fbc
  if (typeof document !== 'undefined') {
    const fbcCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('_fbc='))
      ?.split('=')[1];

    if (fbcCookie) {
      params.fbc = fbcCookie;
    }
  }

  // Tentar obter fbp do cookie _fbp
  if (typeof document !== 'undefined') {
    const fbpCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('_fbp='))
      ?.split('=')[1];

    if (fbpCookie) {
      params.fbp = fbpCookie;
    }
  }

  return params;
}

export function validateFbc(fbc: string): boolean {
  // Validar formato do fbc: fb.1.creationTime.fbclid
  const parts = fbc.split('.');
  if (parts.length !== 4) return false;
  if (parts[0] !== 'fb') return false;
  if (!/^\d+$/.test(parts[1])) return false; // subdomainIndex
  if (!/^\d+$/.test(parts[2])) return false; // creationTime
  if (!parts[3]) return false; // fbclid não pode estar vazio

  return true;
}

/**
 * Prepara os dados do usuário para envio ao Meta Pixel e API de Conversão
 * Todos os dados pessoais são hasheados antes do envio
 */
export function prepareUserData(data: {
  email?: string;
  phone?: string;
  name?: string;
  fbc?: string;
  fbp?: string;
}): Record<string, any> {
  const userData: Record<string, any> = {};

  // Adicionar FBC e FBP se disponíveis
  if (data.fbc) userData.fbc = data.fbc;
  if (data.fbp) userData.fbp = data.fbp;

  // Adicionar email hasheado se disponível
  if (data.email) {
    userData.em = [hashData(data.email.toLowerCase().trim())];
  }

  // Adicionar telefone hasheado se disponível
  if (data.phone) {
    // Normalizar telefone (apenas números com código do país)
    const normalizedPhone = data.phone.replace(/\D/g, '');
    // Garantir que o número tenha o código do país
    const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
    // Hash do número normalizado
    userData.ph = [hashData(phoneWithCountry)];
    
    console.log("[Meta] Telefone normalizado e hasheado:", {
      original: data.phone,
      normalized: phoneWithCountry,
      hashed: userData.ph[0].substring(0, 8) + "..."
    });
  }

  // Adicionar nome hasheado se disponível
  if (data.name) {
    // Separar nome e sobrenome
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    if (firstName) {
      userData.fn = [hashData(firstName.toLowerCase().trim())];
    }
    if (lastName) {
      userData.ln = [hashData(lastName.toLowerCase().trim())];
    }
  }

  // Adicionar dados obrigatórios do cliente
  if (typeof window !== 'undefined') {
    userData.client_user_agent = window.navigator.userAgent;
    userData.client_ip_address = null; // Será preenchido pelo servidor
  }

  // Log do user_data final
  console.log("[Meta] User data preparado:", {
    hasPhone: !!userData.ph,
    hasEmail: !!userData.em,
    hasName: !!(userData.fn || userData.ln),
    hasFbc: !!userData.fbc,
    hasFbp: !!userData.fbp,
    phoneHash: userData.ph ? userData.ph[0].substring(0, 8) + "..." : null
  });

  return userData;
}

/**
 * Função para hashear dados usando SHA-256
 * Segue as especificações do Meta para hasheamento de dados pessoais
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
    return '';
  }
} 