# Rastreamento GA4 e Google Ads

Esta biblioteca implementa o rastreamento do Google Analytics 4 (GA4) e integração com Google Ads para a aplicação. 

## Recursos

- **Rastreamento de eventos GA4**: Envio de eventos para o Google Analytics 4
- **Integration com Google Ads**: Conversões detectadas automaticamente pelo Google Ads
- **Measurement Protocol**: Envio de eventos server-side para evitar bloqueadores
- **Gateway Meta → GA4**: Conversão automática de eventos do Meta Pixel para GA4
- **User ID e User Properties**: Suporte completo para dados de usuário do GA4

## Configuração

### Variáveis de Ambiente

A biblioteca utiliza as seguintes variáveis de ambiente:

```
# Google Analytics 4 & Measurement Protocol
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX   # Seu ID de medição do GA4
GA4_API_SECRET=XXXXXXXXXX                     # API Secret para o Measurement Protocol
```

## Uso Básico

### Rastreamento de Eventos

```jsx
import { useGA4 } from '@/lib/ga4-tracking/exports';

function MeuComponente() {
  const { trackEvent } = useGA4();
  
  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'comprar',
      value: 100,
      currency: 'BRL'
    });
  };
  
  return <button onClick={handleClick}>Clique Aqui</button>;
}
```

### User ID (ID do Usuário)

O User ID permite rastrear usuários entre dispositivos e sessões. Use-o sempre que um usuário estiver logado.

```jsx
import { useGA4 } from '@/lib/ga4-tracking/exports';

function LoginComponent() {
  const { setUserId } = useGA4();
  
  const handleLogin = async (credentials) => {
    const response = await api.login(credentials);
    
    if (response.success) {
      // Definir o GA4 User ID após login bem-sucedido
      // Use um ID não-PII (não use email, nome, telefone, etc.)
      setUserId(response.user.id); // ou qualquer ID único não-sensível
    }
  };
  
  return <form onSubmit={handleLogin}>...</form>;
}
```

### User Properties (Propriedades do Usuário)

User Properties são atributos que descrevem segmentos da sua base de usuários.

```jsx
import { useGA4 } from '@/lib/ga4-tracking/exports';

function ProfileSettingsComponent() {
  const { setUserProperty, setUserProperties } = useGA4();
  
  // Definir uma única propriedade
  setUserProperty('customer_tier', 'premium');
  
  // Ou várias propriedades de uma vez
  setUserProperties({
    customer_tier: 'premium',
    language_preference: 'pt-br',
    account_type: 'business'
  });
  
  return <div>...</div>;
}
```

## Gateway Meta → GA4

O sistema inclui um gateway que intercepta eventos do Meta Pixel e os envia também para o GA4.

### Como Funciona

1. Os eventos enviados via `metaPixel.trackEvent()` são interceptados
2. O nome do evento é mapeado para o formato do GA4
3. Os parâmetros são convertidos para o formato do GA4
4. Dados de usuário são sincronizados entre os sistemas
5. O evento é enviado para ambas as plataformas

### Personalização do Mapeamento de User Properties

Para personalizar o mapeamento de propriedades do usuário, edite o objeto `USER_PROPERTIES_MAP` em `lib/ga4-tracking/meta-gateway.js`:

```javascript
const USER_PROPERTIES_MAP = {
  'metaPropertyName': 'ga4PropertyName',
  'customer_type': 'customer_tier',
  // ... outras propriedades
};
```

## Uso Avançado

### Envio Direto (Fora de Componentes React)

```javascript
import { setUserId, setUserProperty, sendEvent } from '@/lib/ga4-tracking/exports';

// Em qualquer arquivo JavaScript (não-React)
setUserId('user123');
setUserProperty('customer_tier', 'premium');
sendEvent('custom_event', { param1: 'value1' });
```

### Limpar Dados do Usuário (Logout)

```jsx
import { useGA4 } from '@/lib/ga4-tracking/exports';

function LogoutButton() {
  const { clearUserData } = useGA4();
  
  const handleLogout = () => {
    // Limpar os dados do usuário no GA4
    clearUserData();
    // ... lógica de logout
  };
  
  return <button onClick={handleLogout}>Sair</button>;
}
```

## Limitações e Boas Práticas

### Limitações de User Properties

- Máximo de 25 propriedades de usuário por projeto GA4
- Nomes reservados não podem ser usados (consulte a documentação)
- Não armazene dados sensíveis ou PII (informações de identificação pessoal)

### Boas Práticas

- Configure um ID de usuário não-sensível (não use email, telefone, etc.)
- Defina propriedades que descrevem segmentos significativos de usuários
- Use nomes claros e descritivos para as propriedades
- Mantenha a consistência com a nomenclatura para facilitar a análise

## Suporte ao Google Ads

Para utilizar as conversões no Google Ads:

1. Vincule o GA4 ao Google Ads no painel de administração
2. Marque eventos relevantes como conversões no GA4
3. Importe as conversões no Google Ads

Os eventos serão automaticamente transmitidos para o Google Ads quando as contas estiverem vinculadas. 