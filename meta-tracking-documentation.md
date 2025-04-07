# Documentação do Sistema Modular de Rastreamento Meta Pixel

Este documento descreve a arquitetura e o funcionamento do sistema modular implementado para rastrear eventos do Meta Pixel (Facebook Pixel) e enviar dados para a API de Conversões (CAPI) neste projeto Next.js.

## Guia Rápido de Migração para Outro Projeto Next.js

Este guia destina-se a desenvolvedores e gestores de tráfego (com auxílio de IA como Cursor ou V0) para migrar este sistema de rastreamento para outra Landing Page ou site Next.js (utilizando App Router).

**Pré-requisitos:**

*   O projeto de destino deve ser Next.js (versão 13+ com App Router).
*   Acesso para modificar o código do projeto de destino.
*   Acesso para configurar variáveis de ambiente no serviço de hospedagem (ex: Vercel).
*   Credenciais do Meta Pixel: Pixel ID, Token de Acesso da API de Conversões.

**Passo a Passo:**

1.  **Copiar Arquivos de Rastreamento:**
    *   Peça ao seu assistente de IA ou copie manualmente a pasta `lib/meta-tracking` deste projeto para dentro da pasta `lib` do projeto de destino.
    *   Se a pasta `lib` não existir no projeto de destino, crie-a primeiro.

2.  **Copiar Componente Inicializador:**
    *   Peça ao seu assistente de IA ou copie manualmente o arquivo `components/layout/MetaPixelInitializer.jsx` deste projeto para uma pasta similar (ex: `components/layout`) no projeto de destino.
    *   Certifique-se de que o caminho de importação dentro de `MetaPixelInitializer.jsx` para `@/lib/meta-tracking/...` esteja correto para a estrutura do projeto de destino.

3.  **Copiar Rota da API:**
    *   Peça ao seu assistente de IA ou copie manualmente a pasta `app/api/meta-conversions` (incluindo o arquivo `route.js` dentro dela) deste projeto para dentro da pasta `app/api` do projeto de destino.
    *   Verifique se os caminhos de importação dentro de `route.js` para `@/lib/meta-tracking/...` estão corretos.

4.  **Integrar o Inicializador no Layout:**
    *   Abra o arquivo principal de layout do projeto de destino (geralmente `app/layout.js` ou `app/layout.tsx`).
    *   Importe o componente `MetaPixelInitializer`:
        ```javascript
        import { MetaPixelInitializer } from '@/components/layout/MetaPixelInitializer'; // Ajuste o caminho se necessário
        ```
    *   Inclua o componente `<MetaPixelInitializer />` dentro da tag `<body>` do seu layout, preferencialmente logo após a abertura da tag ou antes do fechamento dela. O local exato dentro do `<body>` não é crítico, mas ele precisa estar presente em todas as páginas.
        ```jsx
        export default function RootLayout({ children }) {
          return (
            <html lang="en">
              <body>
                {/* ... outros componentes do layout ... */}
                {children}
                <MetaPixelInitializer /> {/* Adicione esta linha */}
              </body>
            </html>
          );
        }
        ```
        
    *   **Prompt para IA:** Use o seguinte prompt para pedir ajuda ao Cursor ou V0:
        ```
        Preciso integrar o Meta Pixel no layout principal da aplicação. Por favor:
        1. Abra o arquivo app/layout.js (ou app/layout.tsx)
        2. Adicione a importação: import { MetaPixelInitializer } from '@/components/layout/MetaPixelInitializer';
        3. Adicione o componente <MetaPixelInitializer /> dentro da tag <body> do layout, preferencialmente antes do fechamento da tag.
        Certifique-se de preservar todo o resto do código existente no layout.
        ```

5.  **Configurar Variáveis de Ambiente:**
    *   Acesse as configurações do seu serviço de hospedagem (ex: Vercel) ou seu arquivo `.env.local` para desenvolvimento.
    *   Adicione as seguintes variáveis de ambiente (substitua pelos seus valores reais):
        *   `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`: O ID do seu Meta Pixel (Ex: `1234567890`).
        *   `META_API_ACCESS_TOKEN`: O Token de Acesso da API de Conversões (Ex: `EAAD...`). **Importante**: Não use o prefixo `NEXT_PUBLIC_` para esta variável.
        *   `META_TEST_EVENT_CODE`: (Opcional, para testes) O código de teste da API de Conversões (Ex: `TEST12345`). **Importante**: Não use o prefixo `NEXT_PUBLIC_`.
    *   **No Vercel:** Certifique-se de que as variáveis estejam disponíveis nos ambientes desejados (Production, Preview, Development).
    
    *   **Prompt para IA (Configuração Local):** Use o seguinte prompt para criar um arquivo .env.local:
        ```
        Preciso criar um arquivo .env.local na raiz do projeto com as variáveis de ambiente para o Meta Pixel. Por favor:
        1. Crie um novo arquivo chamado .env.local na raiz do projeto
        2. Adicione as seguintes variáveis (eu substituirei os valores):
           NEXT_PUBLIC_FACEBOOK_PIXEL_ID=1234567890
           META_API_ACCESS_TOKEN=EAAD...
           META_TEST_EVENT_CODE=TEST12345
        
        Lembre-me que não devo versionar este arquivo no controle de código (adicionar no .gitignore se ainda não estiver).
        ```

6.  **Adaptar Rastreamento de Eventos Específicos (se necessário):**
    *   O rastreamento de `PageView` já estará funcionando automaticamente devido ao `MetaPixelInitializer`.
    *   Para outros eventos (ex: `Contact`, `Lead`, cliques em botões específicos), você precisará encontrar os locais no código do projeto de destino onde essas ações ocorrem (ex: envio de formulários, cliques em botões).
    *   Peça ao seu assistente de IA para ajudá-lo a localizar esses pontos e a inserir as chamadas de rastreamento.
    *   Importe o hook `useMetaPixel` (ou `useMetaPixelContext` se preferir usar o Provider) nos componentes relevantes:
        ```javascript
        import { useMetaPixel } from '@/lib/meta-tracking/hooks/useMetaPixel';
        ```
    *   Use a função `trackEvent` para disparar os eventos:
        ```jsx
        const { trackEvent } = useMetaPixel();

        const handleSubmit = (formData) => {
          // ... lógica de envio do formulário ...

          // Rastrear evento Lead
          trackEvent('Lead', {
            content_name: 'NomeDoFormularioOuPagina',
            // Adicione outros dados relevantes do formulário
            // Dados como email e telefone serão hasheados automaticamente se passados
            email: formData.email,
            phone: formData.phone
          });
        };
        ```
    *   **Importante:** Se o projeto original possuía eventos customizados em `/lib/meta-tracking/events`, copie esses arquivos também e adapte as chamadas `trackEvent` conforme necessário.
    
    *   **Prompt para IA (Adaptação de Formulário):** Use estes prompts para adaptar eventos em componentes específicos:
    
        **Exemplo 1 - Formulário de Contato:**
        ```
        Preciso implementar o rastreamento do Meta Pixel em um formulário de contato. Por favor:
        1. Analise o código do componente em [CAMINHO_DO_COMPONENTE_DO_FORMULÁRIO]
        2. Adicione a importação do hook: import { useMetaPixel } from '@/lib/meta-tracking/hooks/useMetaPixel';
        3. Extraia o método trackEvent do hook dentro do componente
        4. Na função de submissão do formulário, após a validação e antes/depois do envio dos dados, adicione uma chamada para:
           trackEvent('Contact', {
             content_name: 'Formulário de Contato',
             email: [CAMPO_DE_EMAIL_DO_FORM],
             phone: [CAMPO_DE_TELEFONE_DO_FORM],
             form_location: 'pagina-contato'  // ou outro identificador relevante
           });
        ```
        
        **Exemplo 2 - Botão de Call-to-Action:**
        ```
        Preciso implementar o rastreamento do Meta Pixel em um botão de CTA. Por favor:
        1. Analise o código do componente em [CAMINHO_DO_COMPONENTE_DO_BOTÃO]
        2. Adicione a importação do hook: import { useMetaPixel } from '@/lib/meta-tracking/hooks/useMetaPixel';
        3. Extraia o método trackEvent do hook dentro do componente
        4. No handler de clique do botão, adicione a chamada:
           trackEvent('Lead', {
             content_name: 'Botão [NOME_DO_BOTÃO]',
             button_location: '[LOCAL_DO_BOTÃO]',
             button_text: '[TEXTO_DO_BOTÃO]'
           });
        ```
        
        **Exemplo 3 - Para Buscar Formulários:**
        ```
        Preciso localizar todos os formulários neste projeto para implementar o rastreamento do Meta Pixel. Por favor:
        1. Busque por todos os componentes que contêm formulários (<form>) ou lógica de submissão
        2. Liste os caminhos dos arquivos encontrados
        3. Para cada arquivo encontrado, me mostre onde devo adicionar o código de rastreamento (dentro do handler de submissão)
        ```

7.  **Testar:**
    *   Execute o projeto localmente (`npm run dev`) e verifique o console do navegador para logs do `[Meta Pixel]`.
    *   Use a extensão Meta Pixel Helper no Chrome para verificar se os eventos estão sendo disparados.
    *   Verifique o Gerenciador de Eventos do Facebook (na seção "Testar Eventos" usando o `META_TEST_EVENT_CODE` se configurado) para confirmar o recebimento dos eventos do navegador e do servidor (CAPI).
    *   Faça um deploy para Preview (ex: Vercel) e repita os testes.

Com estes passos, o sistema modular de rastreamento deve estar funcional no novo projeto.

---

## Visão Geral (Detalhada)

O sistema foi projetado para ser modular, reutilizável e fácil de manter. Ele separa as responsabilidades em diferentes diretórios e arquivos, permitindo que o rastreamento seja facilmente adaptado ou estendido.

A estrutura principal reside em `/lib/meta-tracking` e é organizada da seguinte forma:

- **`core`**: Funções essenciais e utilitários (inicialização, hash, coleta de dados, deduplicação, logs).
- **`events`**: Implementação específica para cada tipo de evento padrão ou customizado do Meta Pixel.
- **`api`**: Funções para comunicação com o endpoint da API de Conversões.
- **`hooks`**: Hooks React para facilitar o uso do sistema em componentes.
- **`context`**: Provider React para gerenciar o estado global do rastreamento.
- **`config`**: Configurações centralizadas do sistema.

Além disso, existem componentes e rotas de API relacionadas:

- **`components/layout/MetaPixelInitializer.jsx`**: Componente responsável por inicializar o sistema no layout principal.
- **`app/api/meta-conversions/route.js`**: Endpoint da API do Next.js que recebe os eventos do cliente e os envia para a API de Conversões do Meta.

## Fluxo de Dados

1.  **Inicialização**: O `MetaPixelInitializer.jsx` (ou o `MetaPixelProvider.jsx`) utiliza o hook `useMetaPixel` para chamar `initializeMetaPixel` do `core/initialize.js`. Isso carrega o script base do `fbq` e o configura com o `PIXEL_ID`.
2.  **Disparo do Evento**: Quando um evento precisa ser rastreado (ex: PageView, clique em botão), um hook ou função específica (ex: `trackPageView` em `events/page-view.js`) é chamado.
3.  **Coleta de Dados**: Funções em `core/data-collector.js` coletam informações universais da página e dados específicos do evento.
4.  **Hashing**: Dados sensíveis (email, telefone) são normalizados e hasheados usando funções de `core/hash-utils.js`.
5.  **Deduplicação**: O sistema em `core/dedupe.js` verifica se um evento similar já foi enviado recentemente para evitar duplicatas.
6.  **Envio**: A função `sendEvent` em `api/send-event.js` é chamada. Ela orquestra o envio:
    *   **API de Conversões**: Chama `sendConversionAPI`, que envia uma requisição `POST` para o endpoint `/api/meta-conversions`.
    *   **Pixel (Browser)**: Chama `sendPixelEvent`, que utiliza `window.fbq('track', ...)` para enviar o evento pelo navegador.
7.  **Endpoint da API**: A rota `/api/meta-conversions/route.js` recebe a requisição do cliente, enriquece os dados (IP, User Agent do servidor), valida as configurações (Tokens) e envia os dados para a API oficial do Meta (`graph.facebook.com`).
8.  **Logging**: Em todas as etapas, o `core/logger.js` registra informações detalhadas (em desenvolvimento) ou essenciais (em produção) para depuração.

## Módulos Principais

### `/lib/meta-tracking/core`

-   **`initialize.js`**:
    -   `initializeMetaPixel`: Função principal para carregar e configurar o `fbq`. Inclui a proteção contra o envio automático do evento `PageView`.
    -   `isPixelInitialized`: Verifica se o `fbq` já foi carregado.
-   **`hash-utils.js`**:
    -   `normalizeAndHashEmail`, `normalizeAndHashPhone`, `normalizeAndHashName`: Funções para limpar e hashear dados do usuário antes do envio (implementação de hash SHA256 real necessária em produção).
    -   `hashData`: Função base de hash (exemplo simplificado).
    -   `getFbp`, `getFbc`, `getExternalId`: Utilitários para ler cookies relevantes (`_fbp`, `_fbc`, `_vfx_extid`).
-   **`data-collector.js`**:
    -   `collectPageData`: Coleta informações da página atual (URL, título, referrer, dimensões da tela/viewport, idioma).
    -   `collectUserData`: Coleta informações básicas do usuário (User Agent) e permite adicionar dados extras.
-   **`dedupe.js`**:
    -   `generateEventId`: Cria um ID único para cada evento.
    -   `generateDedupeKey`: Cria uma chave única baseada no nome e parâmetros do evento para identificar duplicatas.
    -   `isEventDuplicate`: Verifica no `localStorage` se um evento com a mesma chave já foi enviado dentro do período de expiração.
    -   `markEventAsSent`: Registra um evento no `localStorage` com timestamp após o envio.
-   **`logger.js`**:
    -   Sistema de log configurável com níveis (DEBUG, INFO, WARN, ERROR) e categorias. Habilitado por padrão, com nível DEBUG em desenvolvimento e INFO em produção.

### `/lib/meta-tracking/events`

-   Contém arquivos individuais para cada evento (ex: `page-view.js`, `contact.js`, `lead.js`).
-   Cada arquivo exporta uma função `async` (ex: `trackPageView`) que:
    1.  Verifica se está no ambiente do cliente.
    2.  Chama `isEventDuplicate` para evitar envios repetidos (se aplicável ao evento).
    3.  Coleta dados específicos do evento e dados universais (`collectPageData`, `collectUserData`).
    4.  Prepara o objeto do evento com `event_name`, `event_id`, `custom_data`, `user_data`, etc.
    5.  Chama `sendEvent` (de `api/send-event.js`) para disparar o envio via Pixel e CAPI.
    6.  Se o envio for bem-sucedido e a deduplicação for necessária, chama `markEventAsSent`.
-   **Como adicionar novos eventos**: Crie um novo arquivo (ex: `add-to-cart.js`), implemente a lógica de coleta de dados e chame `sendEvent`. Atualize o hook `useMetaPixel` para incluir o novo evento no `switch`.

### `/lib/meta-tracking/api`

-   **`send-event.js`**:
    -   `sendEvent`: Função principal que recebe um objeto de evento, garante um `event_id` e chama `sendConversionAPI` e `sendPixelEvent` em paralelo.
    -   `sendConversionAPI`: Envia a requisição `POST` para o endpoint interno `/api/meta-conversions`. Inclui lógica de retry simples.
    -   `sendPixelEvent`: Utiliza `window.fbq('track', ...)` para enviar o evento pelo navegador.

### `/lib/meta-tracking/hooks`

-   **`useMetaPixel.js`**:
    -   Hook principal para interagir com o sistema.
    -   Provê:
        -   `isInitialized`: Estado booleano indicando se o Pixel foi inicializado.
        -   `initialize`: Função para inicializar o Pixel (geralmente chamada pelo Provider ou Initializer).
        -   `trackPage`: Atalho para chamar `trackPageView`.
        -   `trackEvent`: Função genérica para rastrear qualquer evento pelo nome (ex: `trackEvent('Contact', { email: '...' })`). O hook direciona para a função específica do evento correspondente ou usa um envio genérico `fbq('track', ...)` se não houver implementação específica.
-   **Outros Hooks (Exemplos)**: Poderiam ser criados hooks específicos como `useScrollTracking`, `useFormTracking`, etc., para encapsular a lógica de rastreamento de interações comuns.

### `/lib/meta-tracking/context`

-   **`MetaPixelProvider.jsx`**:
    -   Provider React que utiliza o hook `useMetaPixel`.
    -   Inicializa o sistema automaticamente ao ser montado.
    -   Envia o primeiro `PageView` após a inicialização.
    -   Adiciona listeners para `popstate` para rastrear mudanças de rota no histórico do navegador.
    -   Disponibiliza `isInitialized`, `trackPage`, e `trackEvent` para os componentes filhos via contexto (`useMetaPixelContext`).

### `/lib/meta-tracking/config`

-   **`index.js`**:
    -   `getConfig`: Retorna as configurações necessárias para o lado do cliente (principalmente `PIXEL_ID`). Inclui diagnósticos no console em desenvolvimento.
    -   `getServerConfig`: Retorna as configurações necessárias para o lado do servidor (API Routes), incluindo `PIXEL_ID`, `ACCESS_TOKEN`, e `TEST_EVENT_CODE`. Também inclui diagnósticos detalhados.
    -   As configurações são primariamente lidas das variáveis de ambiente (`process.env`).

## Componentes e Rotas

### `/components/layout/MetaPixelInitializer.jsx`

-   Componente simples que deve ser incluído uma vez no layout principal da aplicação (ex: `app/layout.js`).
-   Utiliza o hook `useMetaPixel` para garantir a inicialização e o rastreamento de `PageView` em todas as páginas e mudanças de rota.
-   Alternativa: Usar o `MetaPixelProvider` diretamente no layout envolvendo o `{children}`.

### `/app/api/meta-conversions/route.js`

-   Endpoint Next.js Serverless Function.
-   Recebe eventos enviados pelo `sendConversionAPI` do cliente.
-   Utiliza `getServerConfig` para obter `PIXEL_ID` e `ACCESS_TOKEN`.
-   **Valida o Token**: Se `ACCESS_TOKEN` não estiver configurado nas variáveis de ambiente do servidor, retorna erro 500.
-   **Enriquece Dados**: Adiciona `client_ip_address` e `client_user_agent` (obtidos dos headers da requisição no servidor).
-   **Envia para o Meta**: Faz a requisição `POST` final para `https://graph.facebook.com/v17.0/{PIXEL_ID}/events`.
-   Inclui headers CORS e tratamento de método `OPTIONS`.

## Configuração

O sistema depende das seguintes variáveis de ambiente:

-   **`NEXT_PUBLIC_FACEBOOK_PIXEL_ID`**: (Obrigatória - Cliente & Servidor) O ID do seu Meta Pixel. O prefixo `NEXT_PUBLIC_` a torna acessível no navegador.
-   **`FACEBOOK_PIXEL_ID`**: (Opcional - Servidor) Pode ser usada como alternativa no servidor se `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` não estiver definida por algum motivo.
-   **`META_API_ACCESS_TOKEN`**: (Obrigatória - Servidor) O token de acesso da API de Conversões gerado no Gerenciador de Eventos do Facebook. **Não** use o prefixo `NEXT_PUBLIC_`.
-   **`META_TEST_EVENT_CODE`**: (Opcional - Servidor) O código de teste fornecido pelo Facebook para depurar eventos da CAPI no Gerenciador de Eventos. **Não** use o prefixo `NEXT_PUBLIC_`.

Certifique-se de que estas variáveis estão configuradas corretamente no seu ambiente de desenvolvimento (`.env.local`) e no ambiente de produção/preview (ex: Vercel Environment Variables).

## Como Usar

1.  **Inicialização**: Inclua `<MetaPixelInitializer />` ou envolva sua aplicação com `<MetaPixelProvider>` no arquivo `app/layout.js`.
2.  **Rastrear Eventos**: Em seus componentes ou páginas, use o hook `useMetaPixelContext` (se estiver usando o Provider) ou `useMetaPixel` diretamente:

    ```jsx
    import { useMetaPixelContext } from '@/lib/meta-tracking/context/MetaPixelProvider'; // Ou useMetaPixel

    function MyComponent() {
      const { trackEvent } = useMetaPixelContext(); // Ou useMetaPixel()

      const handleContactSubmit = (formData) => {
        trackEvent('Contact', {
          content_name: 'Formulario Rodape',
          email: formData.email, // O sistema fará o hash
          phone: formData.phone  // O sistema fará o hash
        });
      };

      // ...
    }
    ```

## Extensibilidade

-   **Novos Eventos**: Crie arquivos em `/lib/meta-tracking/events` e atualize o `switch` em `useMetaPixel.js`.
-   **Novos Hooks**: Crie hooks específicos em `/lib/meta-tracking/hooks` para interações complexas (ex: rastreamento de vídeo com `useVideoTracking`).
-   **Configuração**: Modifique `/lib/meta-tracking/config/index.js` para adicionar novas opções de configuração.
-   **Utilitários**: Adicione novas funções de hash ou coleta de dados em `/lib/meta-tracking/core`.

Esta estrutura modular fornece uma base sólida para o rastreamento de eventos, facilitando a manutenção e a portabilidade do código entre diferentes projetos. 