# Documentação de Rastreamento GA4 e Google Ads

Este documento descreve a implementação de rastreamento do Google Analytics 4 (GA4) e sua integração com o Google Ads para conversões.

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Eventos Implementados](#eventos-implementados)
4. [Rastreamento de Conversões](#rastreamento-de-conversões)
5. [Integração com Google Ads](#integração-com-google-ads)
6. [Orientações para Desenvolvedores](#orientações-para-desenvolvedores)
7. [Troubleshooting](#troubleshooting)

## Visão Geral

A implementação do GA4 nesta landing page foi projetada para:

- Rastrear eventos padrão (visualizações de página, scrolls)
- Rastrear eventos de conversão (leads)
- Enviar dados via browser (gtag.js) e servidor (Measurement Protocol)
- Integrar com Google Ads para conversões

Essa implementação complementa o rastreamento do Meta Pixel e CAPI já existente, reutilizando a mesma estrutura de eventos.

## Configuração

### Variáveis de Ambiente

Abra o arquivo `.env.local` e configure as seguintes variáveis:

```
# GA4 e Google Ads
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # ID da propriedade GA4
GA4_API_SECRET=XXXXXXXXXX                    # API Secret do Measurement Protocol
```

### No Google Analytics 4

1. Crie uma propriedade GA4 no [Google Analytics](https://analytics.google.com/)
2. Obtenha o Measurement ID (formato G-XXXXXXXX)
3. Vá em Admin > Data Streams > Web > Configurações avançadas
4. Gere uma chave de API Secret para o Measurement Protocol
5. Configure a mesma como `GA4_API_SECRET` na aplicação

### Conexão com Google Ads

1. No Google Analytics, vá em Admin > Configurações da Propriedade > Links com Produtos
2. Clique em "Link com Google Ads"
3. Selecione a conta do Google Ads que deseja vincular
4. Siga as instruções para completar a vinculação

## Eventos Implementados

A implementação rastreia os seguintes eventos:

| Evento GA4 | Descrição | Equivalente Meta Pixel |
|------------|-----------|------------------------|
| `page_view` | Visualização de página | `PageView` |
| `view_item` | Visualização de conteúdo | `ViewContent` |
| `scroll` | Profundidade de scroll (25%, 50%, 75%, 90%) | `ScrollDepth` |
| `contact` | Contato com a empresa | `Contact` |
| `generate_lead` | Captura de lead | `Lead` |

## Rastreamento de Conversões

### Eventos de Lead

Para rastrear um lead, use o hook `useEventTracking`:

```jsx
import { useEventTracking } from "@/lib/hooks/use-event-tracking";

function LeadForm() {
  const { trackLead } = useEventTracking();
  
  const handleSubmit = async (formData) => {
    // Processar o formulário...
    
    // Rastrear a conversão
    trackLead({
      content_category: "formulário",
      content_name: "formulário de contato principal",
      value: 0, // valor estimado da conversão, se aplicável
      currency: "BRL",
      form_id: "contato-principal",
      lead_id: leadId, // ID único do lead gerado
      lead_type: "contato"
    });
  };
  
  return (
    // Seu formulário aqui
  );
}
```

Este código enviará o evento tanto para o GA4 quanto para o Meta Pixel automaticamente.

## Integração com Google Ads

### Configuração das Conversões no Google Ads

1. No Google Ads, vá em "Ferramentas e Configurações" > "Medição" > "Conversões"
2. Clique em "Nova ação de conversão" > "Importar" > "Google Analytics 4"
3. Selecione a propriedade GA4 vinculada
4. Escolha o evento `generate_lead` como conversão
5. Configure os detalhes da conversão (valor, janela de atribuição, etc.)
6. Salve a conversão

### Rastreamento via Google Tag

Por padrão, o GA4 envia os eventos para o Google Ads automaticamente após a integração.

Para envio manual de conversões (opcional), você pode usar o método `trackConversion`:

```jsx
import { useGA4 } from "@/lib/hooks/use-ga4";

function SomeComponent() {
  const { trackConversion } = useGA4();
  
  const handleImportantAction = () => {
    // Código da ação...
    
    // Rastrear conversão diretamente para o Google Ads
    trackConversion(
      'AW-CONVERSION_ID',  // ID de conversão do Google Ads
      'CONVERSION_LABEL',  // Rótulo de conversão
      { 
        value: 100,        // Valor da conversão
        currency: 'BRL',
        transaction_id: 'ID123' // Opcional para deduplicação
      }
    );
  };
  
  return (
    // Seu componente aqui
  );
}
```

## Orientações para Desenvolvedores

### Estrutura de Arquivos

```
lib/
├── config/
│   └── ga4.ts                 # Configurações do GA4
├── hooks/
│   ├── use-ga4.ts             # Hook principal do GA4
│   └── use-event-tracking.ts  # Hook unificado (GA4 + Meta)
├── types/
│   └── ga4.d.ts               # Tipagens do GA4
├── utils/
│   ├── ga4-logger.ts          # Utilitário de logging
│   └── event-utils.ts         # Utilitários para eventos
app/
├── api/
│   └── ga4-measurement/       # Endpoint do Measurement Protocol
components/
├── analytics/
│   └── ga4-tag.tsx            # Componente para carregar o script
└── providers/
    └── ga4-provider.tsx       # Provider do GA4
```

### Fluxo de Inicialização e Rastreamento

1. O `app/layout.tsx` carrega o `GA4Provider` e o `GA4Tag`
2. O `GA4Tag` inicia o script do GA4 enquanto o `GA4Provider` inicializa a configuração
3. O `useGA4` fornece métodos para rastrear eventos específicos do GA4
4. O `useEventTracking` simplifica o envio simultâneo para GA4 e Meta Pixel

### Measurement Protocol

O endpoint `/api/ga4-measurement` permite enviar eventos do servidor com informações adicionais:

- IP do cliente (para melhor precisão geográfica)
- User-Agent (para melhor identificação do dispositivo)
- Client ID consistente (para associar sessões)

## Troubleshooting

### Verificação de Implementação

Para verificar se a implementação está funcionando:

1. Instale a extensão [Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy/kejbdjndbnbjgmefkgdddjlbokphdefk) no Chrome
2. Visite o site e verifique se o GA4 está disparando eventos
3. No GA4, use o "DebugView" para ver eventos em tempo real

### Problemas Comuns

- **Eventos não aparecem no GA4**: Verifique se o `NEXT_PUBLIC_GA4_MEASUREMENT_ID` está configurado corretamente
- **Eventos do servidor não são enviados**: Verifique se o `GA4_API_SECRET` está configurado corretamente
- **Conversões não aparecem no Google Ads**: Verifique se:
  - A propriedade GA4 está corretamente vinculada ao Google Ads
  - A importação de conversões está configurada no Google Ads
  - O evento `generate_lead` está sendo disparado corretamente
  - Há um atraso normal de 24-48h para os dados aparecerem no Google Ads

### Logs de Diagnóstico

Em ambiente de desenvolvimento, você pode acessar logs detalhados:

```javascript
// No console do navegador
window._ga4Logs.getLogs();                // Todos os logs
window._ga4Logs.getLogsByCategory('init'); // Logs de inicialização
```

## Conclusão

Esta implementação do GA4 e Google Ads foi projetada para complementar o rastreamento existente do Meta Pixel, permitindo medir conversões de forma consistente em ambas as plataformas. O uso do Measurement Protocol garante maior precisão no rastreamento de eventos críticos como leads. 