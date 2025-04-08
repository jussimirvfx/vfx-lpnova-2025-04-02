# Documentação de Rastreamento Google Analytics 4 (GA4) e Google Ads

Este documento descreve a implementação do rastreamento do Google Analytics 4 (GA4) e Google Ads na landing page, incluindo o uso do Measurement Protocol para envio de eventos server-side.

## Visão Geral

O sistema de rastreamento do GA4 foi implementado em paralelo com o Meta Pixel existente, permitindo que os mesmos eventos sejam enviados para ambas as plataformas. A abordagem utilizada foi a de:

1. **Implementar o GA4**: Adicionar o código de rastreamento do Google Analytics 4.
2. **Criar um Gateway**: Interceptar eventos do Meta Pixel e enviá-los também para o GA4.
3. **Usar o Measurement Protocol**: Permitir o envio server-side de eventos para o GA4, similar ao CAPI do Meta.

Esta implementação permite que todos os eventos já configurados para o Meta Pixel sejam automaticamente enviados também para o GA4, sem a necessidade de duplicar código ou modificar os componentes existentes.

## Estrutura do Sistema

O sistema está organizado de forma similar ao Meta Pixel, com uma estrutura modular em:

- **`lib/ga4-tracking/`**: Diretório principal com todos os módulos
  - **`core/`**: Funções essenciais e utilitários
  - **`api/`**: Funções para comunicação com a API do GA4
  - **`hooks/`**: Hooks React para facilitar o uso 
  - **`config/`**: Configurações centralizadas
  - **`meta-gateway.js`**: Gateway para interceptar eventos do Meta Pixel

- **`components/layout/`**:
  - **`GA4Initializer.jsx`**: Componente para inicializar o GA4
  - **`MetaGA4Gateway.jsx`**: Componente para conectar Meta Pixel e GA4

- **`app/api/ga4-events/`**:
  - **`route.js`**: Endpoint da API do Next.js para o Measurement Protocol

## Configuração

### Variáveis de Ambiente

O sistema utiliza as seguintes variáveis de ambiente:

```
# Google Analytics 4 & Measurement Protocol
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX   # Seu ID de medição do GA4
GA4_API_SECRET=XXXXXXXXXX                     # API Secret para o Measurement Protocol
```

**Importante**:
- O `MEASUREMENT_ID` começa com "G-" e é visível para todos (navegador).
- O `API_SECRET` precisa ser mantido seguro (apenas no servidor).

### Como obter as credenciais do GA4

1. **Measurement ID**:
   - Acesse o [Google Analytics](https://analytics.google.com/)
   - Vá para Admin > Propriedade > Streams de dados
   - Selecione seu stream da web
   - O ID de medição (G-XXXXXXXX) estará na seção "Detalhes do stream"

2. **API Secret**:
   - No mesmo local acima, clique em "Measurement Protocol API secrets"
   - Crie um novo secret e copie-o
   - Este secret é usado apenas para envios server-side

### Integrando com o Google Ads

Para utilizar as conversões do GA4 no Google Ads:

1. **Vincular contas**:
   - Acesse o Google Analytics > Admin
   - Em "Configuração da propriedade", selecione "Links do Google Ads"
   - Vincule sua conta do Google Ads

2. **Configurar conversões no GA4**:
   - No GA4, vá para "Configurar > Eventos"
   - Marque os eventos relevantes como conversões
   - Estes eventos estarão disponíveis no Google Ads como conversões

3. **Usar no Google Ads**:
   - No Google Ads, acesse "Ferramentas e Configurações > Medição > Conversões"
   - Você verá suas conversões importadas do GA4
   - Associe-as às suas campanhas conforme necessário

## Como Funciona

### 1. Inicialização do GA4

O componente `GA4Initializer` carrega o script do GA4 e o configura para rastrear pageviews e eventos. Este componente foi adicionado ao layout principal (`app/layout.tsx`).

### 2. Gateway Meta -> GA4

O componente `MetaGA4Gateway` serve como uma ponte entre o Meta Pixel e o GA4. Ele:

1. Inicializa-se quando tanto o Meta Pixel quanto o GA4 estão prontos
2. Intercepta todos os eventos enviados pelo Meta Pixel
3. Converte os nomes dos eventos e parâmetros para o formato do GA4
4. Envia os eventos para o GA4 em paralelo com o Meta Pixel

Desta forma, todos os eventos já configurados para o Meta serão automaticamente enviados também para o GA4.

### 3. Measurement Protocol

Similar à CAPI do Meta, o Measurement Protocol permite enviar eventos para o GA4 server-side. Isto é útil para:

- Evitar bloqueadores de anúncios
- Enviar eventos após o usuário sair da página
- Validar e enriquecer dados no servidor

A implementação inclui:

1. Um cliente no navegador que envia eventos para uma API interna
2. Uma rota de API (`/api/ga4-events`) que recebe os eventos
3. Código no servidor que valida, enriquece e envia para a API do GA4

## Mapeamento de Eventos

Os eventos do Meta Pixel são automaticamente convertidos para o formato de eventos do GA4. O mapeamento atual inclui:

| Evento Meta Pixel | Evento GA4 |
|-------------------|------------|
| PageView          | page_view  |
| ViewContent       | view_item  |
| Lead              | generate_lead |
| Contact           | contact    |
| SubmitApplication | begin_checkout |
| CompleteRegistration | sign_up |

Para eventos personalizados, o sistema converte automaticamente de camelCase (Meta) para snake_case (GA4).

## Testando os Eventos

Para verificar se os eventos estão sendo enviados corretamente:

1. **Navegador**:
   - Use o Chrome DevTools > Network
   - Filtre as requisições para "collect" ou "google-analytics"
   - Os eventos aparecerão como chamadas para estas URLs

2. **GA4 DebugView**:
   - No GA4, vá para "Configure > DebugView"
   - Adicione seu dispositivo à visualização de depuração
   - Você verá os eventos em tempo real

## Troubleshooting

### Eventos não estão aparecendo no GA4

1. **Verificar inicialização**:
   - Abra o Console do navegador
   - Procure mensagens de log com o prefixo `[GA4]`
   - Verifique se há erros de inicialização

2. **Verificar requests de rede**:
   - Use o DevTools > Network
   - Filtre por "collect" ou "google-analytics"
   - Verifique se as chamadas estão ocorrendo

3. **Verificar variáveis de ambiente**:
   - Certifique-se de que o `NEXT_PUBLIC_GA4_MEASUREMENT_ID` está configurado
   - Para o Measurement Protocol, confirme o `GA4_API_SECRET`

### Eventos aparecem no GA4 mas não no Google Ads

1. **Verificar vinculação**:
   - Confirme que as contas do GA4 e Google Ads estão vinculadas
   - Verifique se a propriedade do GA4 está corretamente associada

2. **Verificar configuração de conversões**:
   - No GA4, confirme se os eventos estão marcados como conversões
   - No Google Ads, verifique se as conversões do GA4 foram importadas

## Extensão e Personalização

### Enviando Eventos Diretamente para o GA4

Se você precisar enviar eventos diretamente para o GA4 (sem passar pelo Meta Pixel):

```jsx
import { useGA4 } from '@/lib/ga4-tracking/hooks/useGA4';

function MeuComponente() {
  const { trackEvent } = useGA4();
  
  const handleClick = () => {
    trackEvent('nome_do_evento', {
      // Parâmetros do evento
      parametro1: 'valor1',
      parametro2: 'valor2'
    });
  };
  
  return <button onClick={handleClick}>Clique Aqui</button>;
}
```

### Adicionando Eventos Personalizados

Para adicionar novos eventos personalizados, você pode:

1. Usar o `trackEvent` do hook `useGA4` diretamente
2. Adicionar mapeamentos na função `mapMetaEventToGA4` em `lib/ga4-tracking/hooks/useGA4.js`

## Recomendações para Google Ads

1. **Use as conversões importadas do GA4** em vez de configurar um pixel separado do Google Ads
2. **Configure valores monetários nos eventos** para otimizar campanhas baseadas em valor
3. **Aproveite os segmentos de público do GA4** para targeting no Google Ads
4. **Utilize a atribuição entre dispositivos do GA4** para melhor compreensão da jornada do usuário

---

## Referências

- [Documentação do Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Documentação do Measurement Protocol do GA4](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Vinculando Google Analytics e Google Ads](https://support.google.com/analytics/answer/10269537)
- [Importando conversões do GA4 para o Google Ads](https://support.google.com/google-ads/answer/9744275) 