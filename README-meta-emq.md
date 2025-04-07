# Meta Pixel EMQ Integration Documentation
# Updated: 2025-04-02

# Checklist Exaustivo para Implementação de Rastreamento Meta Pixel e API de Conversões

> **Nota**: Não altere esse arquivo, ele é para consulta apenas.

## 1. Configuração Básica no Código

- [ ] Verificar se o Meta Pixel está instalado corretamente no cabeçalho do site
- [ ] Confirmar se o Conversions API está configurado no servidor
- [ ] Verificar se ambos usam o mesmo Pixel ID para sincronização de dados
- [ ] Verificar se a API de Conversão está configurada para disparar ANTES dos eventos do navegador
- [ ] Confirmar que o sistema de deduplicação está ativo (usando event_id consistente)
- [ ] Verificar se o primeiro evento PageView é disparado antes de qualquer outro evento
- [ ] Verificar se o cookie fbp está sendo corretamente gerado e armazenado
- [ ] Validar que a versão da API em uso é a mais atual

## 2. Parâmetros Universais (para TODOS os eventos)

### API de Conversões (parâmetros obrigatórios):

- [ ] Confirmar que a chamada da API de Conversão é iniciada ANTES do disparo do Pixel
- [ ] Verificar se event_name está consistente com o Pixel
- [ ] Confirmar que event_time está sincronizado com o Pixel para cada evento
- [ ] Validar que action_source está configurado corretamente ("website")
- [ ] Verificar envio de event_id idêntico ao do Pixel para deduplicação
- [ ] Confirmar envio completo de user_data em TODOS os eventos:
  - [ ] client_ip_address
  - [ ] client_user_agent
  - [ ] page_title
  - [ ] page_location
  - [ ] fbp cookie
  - [ ] fbc cookie (quando disponível)
  - [ ] em (email hasheado, quando disponível)
  - [ ] ph (telefone hasheado, quando disponível)
  - [ ] fn/ln (nome/sobrenome hasheados, quando disponíveis)
  - [ ] external_id (ID do cliente hasheado, quando disponível)

### Pixel no Navegador:

- [ ] Verificar envio consistente de event_name em todos os eventos
- [ ] Confirmar geração e envio de event_id único para cada evento
- [ ] Validar envio de event_time preciso em todos os eventos
- [ ] Confirmar que event_source_url está corretamente configurado em cada página
- [ ] Verificar se o fbp (Facebook Browser Pixel) está sendo incluído em todos os eventos
- [ ] Confirmar se o fbc (Facebook Click ID) está sendo capturado e enviado quando presente

## 3. Evento PageView

### API de Conversões:

- [ ] Confirmar que a API de PageView é disparada ANTES do Pixel
- [ ] Confirmar envio paralelo via servidor
- [ ] Verificar se o tempo entre o disparo da API e do Pixel é mínimo
- [ ] Garantir que seja enviado apenas 1 vez por página, mesmo com recarregamentos parciais
- [ ] Verificar que todos os parâmetros universais estão sendo enviados (page_title, page_location, etc.)
- [ ] Confirmar que o evento inclui URL completa, título da página e path como parâmetros
- [ ] Verificar se a referência (document.referrer) está sendo enviada quando disponível
- [ ] Validar que o event_id é consistente entre API e Pixel para deduplicação

### Pixel no Navegador:

- [ ] Verificar se o PageView dispara em todas as páginas
- [ ] Confirmar que dispara imediatamente ao carregar a página
- [ ] Verificar se ocorre antes de qualquer outro evento na mesma página
- [ ] Garantir que seja enviado apenas 1 vez por página, independente de interações do usuário
- [ ] Verificar que todos os parâmetros universais estão sendo enviados
- [ ] Confirmar que parâmetros enriquecidos como viewport_width, screen_width estão incluídos
- [ ] Verificar se a linguagem do navegador (navigator.language) está sendo enviada
- [ ] Validar que o fbp e fbc (quando presente) estão sendo capturados corretamente
- [ ] Confirmar que não há disparos duplicados em mudanças de rota client-side em SPAs

## 4. Evento Scroll

### API de Conversões:

- [ ] Confirmar que a API de Scroll é disparada ANTES do Pixel
- [ ] Confirmar envio paralelo dos mesmos pontos de scroll
- [ ] Verificar se custom_data inclui percent_scroll
- [ ] Validar que os mesmos critérios de disparo são usados no servidor e no navegador

### Pixel no Navegador:

- [ ] Verificar se o evento dispara nos pontos de scroll definidos (25%, 50%, 75%, 100%)
- [ ] Confirmar que os disparos são únicos (não repetidos ao rolar para cima e para baixo)
- [ ] Verificar se inclui o parâmetro percent_scroll
- [ ] Validar que o evento só é enviado após o PageView

## 5. Evento ViewContent (Página de Apresentação)

### API de Conversões:

- [ ] Confirmar que a API de ViewContent é disparada ANTES do Pixel
- [ ] Confirmar envio paralelo do evento ViewContent
- [ ] Verificar se custom_data inclui os mesmos parâmetros do Pixel:
  - [ ] content_name
  - [ ] content_category
  - [ ] content_ids (se aplicável)
- [ ] Validar sincronização temporal entre API e Pixel
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios para o mesmo conteúdo

### Pixel no Navegador:

- [ ] Verificar se dispara corretamente na página /apresentacao
- [ ] Confirmar que contém content_name (ex: "Apresentação do Produto")
- [ ] Verificar se inclui content_category se aplicável
- [ ] Validar que o disparo ocorre após o PageView
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios para o mesmo conteúdo

## 6. Evento Contact (Formulário WhatsApp)

### API de Conversões:

- [ ] Confirmar que a API de Contact é disparada ANTES do Pixel
- [ ] Confirmar envio do evento Contact no servidor
- [ ] Verificar se contém as mesmas informações do evento do Pixel
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios do mesmo usuário
- [ ] Confirmar que o número de telefone capturado no formulário é hasheado e enviado no parâmetro ph
- [ ] Verificar se o número de telefone é normalizado antes do hash (apenas números com código do país)
- [ ] Validar que todos os dados do usuário disponíveis são enviados (hasheados)
- [ ] Confirmar que custom_data inclui:
  - [ ] content_name
  - [ ] content_category (se aplicável)
  - [ ] success_status (se aplicável)

### Pixel no Navegador:

- [ ] Verificar se o evento dispara ao submeter o formulário de WhatsApp
- [ ] Confirmar que captura parâmetros como content_name (ex: "Formulário WhatsApp")
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios do mesmo usuário
- [ ] Confirmar que o número de telefone capturado no formulário é hasheado e enviado no parâmetro ph
- [ ] Verificar se o número de telefone é normalizado antes do hash (apenas números com código do país)
- [ ] Verificar se o evento dispara antes do redirecionamento (se houver)
- [ ] Validar que não dispara em caso de falha na submissão do formulário
- [ ] Verificar se os parâmetros de contato são incluídos (de forma hasheada)

## 7. Evento Lead (Qualificação de Leads)

### API de Conversões:

- [ ] Confirmar que a API de Lead é disparada ANTES do Pixel
- [ ] Verificar se o evento Lead é disparado para TODOS os leads que submeteram o formulário de Reunião WhatsApp ou o formulário de Apresentação
- [ ] Confirmar que o evento é disparado quando a página de obrigado/apresentação carrega após o envio bem-sucedido do formulário
- [ ] Verificar se custom_data inclui:
  - [ ] value calculado pelo lead scoring (0 para leads não qualificados)
  - [ ] currency
  - [ ] content_name
  - [ ] qualification_status ("qualified" ou "unqualified")
- [ ] Validar que o sistema de pontuação (lead scoring) está funcionando corretamente
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios do mesmo usuário

### Pixel no Navegador:

- [ ] Verificar se o evento dispara quando a página de obrigado/apresentação carrega após o envio bem-sucedido do formulário de Reunião WhatsApp ou formulário de Apresentação (para TODOS os leads)
- [ ] Confirmar que o value está sendo calculado e enviado corretamente:
  - [ ] Leads qualificados: valor baseado no lead score (1-100)
  - [ ] Leads não qualificados: valor 0
- [ ] Verificar se currency está definido junto com value (ex: "BRL")
- [ ] Confirmar que não há múltiplos disparos na mesma sessão
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios do mesmo usuário

## 8. Evento SubmitApplication (Para Leads Qualificados)

### API de Conversões:

- [ ] Confirmar que a API de SubmitApplication é disparada ANTES do Pixel
- [ ] Verificar se o evento SubmitApplication é disparado APENAS para leads qualificados que submeteram o formulário de Reunião WhatsApp ou o formulário de Apresentação
- [ ] Confirmar que o evento é disparado logo após o evento Lead quando a página de obrigado/apresentação carrega (apenas para leads qualificados)
- [ ] Verificar se custom_data inclui:
  - [ ] value calculado pelo lead scoring (mesmo valor do evento Lead)
  - [ ] currency (mesmo do evento Lead)
  - [ ] content_name
- [ ] Validar que o threshold de qualificação é aplicado consistentemente
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios do mesmo usuário

### Pixel no Navegador:

- [ ] Verificar se o evento dispara quando a página de obrigado/apresentação carrega após envio bem-sucedido do formulário de Reunião WhatsApp ou formulário de Apresentação (APENAS para leads qualificados)
- [ ] Confirmar que o evento é disparado logo após o evento Lead quando a página de obrigado/apresentação carrega (apenas para leads qualificados)
- [ ] Validar se o value está sendo enviado de forma consistente com o evento Lead
- [ ] Verificar se currency está definido junto com value (ex: "BRL")
- [ ] Confirmar que não há múltiplos disparos na mesma sessão
- [ ] Validar que eventos de otimização estão sendo configurados corretamente no Gerenciador de Eventos do Meta

## 9. Evento VideoPlay

### API de Conversões:

- [ ] Confirmar que a API de VideoPlay é disparada ANTES do Pixel em cada marco de progresso
- [ ] Confirmar envio paralelo do evento VideoPlay nos mesmos marcos de progresso
- [ ] Verificar se custom_data inclui todos os parâmetros relevantes:
  - [ ] content_name
  - [ ] content_id
  - [ ] video_status
  - [ ] video_time
  - [ ] video_duration
  - [ ] video_percent
- [ ] Validar se há deduplicação adequada entre eventos da API e do Pixel
- [ ] Confirmar que o evento não é disparado durante buffering ou pausa
- [ ] Verificar se os eventos são enviados mesmo quando o vídeo está em modo de tela cheia

### Pixel no Navegador:

- [ ] Verificar se o evento dispara nos momentos corretos da reprodução do vídeo:
  - [ ] Início do vídeo ("started")
  - [ ] 25% assistido ("25_watched")
  - [ ] 50% assistido ("50_watched")
  - [ ] 75% assistido ("75_watched")
  - [ ] 100% assistido ("completed")
- [ ] Confirmar que inclui content_name (título do vídeo)
- [ ] Verificar se content_id está definido para identificação única do vídeo
- [ ] Validar se video_status está sendo atualizado corretamente
- [ ] Confirmar que video_time está sendo enviado em segundos
- [ ] Verificar se video_duration está sendo enviado corretamente
- [ ] Validar que video_percent está sendo calculado e enviado precisamente (0-100)
- [ ] Confirmar que o evento não dispara novamente se o usuário assistir ao vídeo mais de uma vez na mesma sessão (a menos que seja desejado)

## 10. Validação da Qualidade dos Dados no Código

- [ ] Validar se os hasheamentos estão funcionando corretamente:
  - [ ] Emails normalizados (minúsculos, sem espaços) antes do hash
  - [ ] Telefones normalizados (somente números, com código do país) antes do hash
  - [ ] Nomes normalizados (minúsculos, sem acentos) antes do hash
- [ ] Verificar se os dados são adequadamente limpos antes do envio
- [ ] Confirmar que o event_id é o mesmo para o evento da API e do Pixel correspondente

## 11. Diagnóstico e Solução de Problemas no Código

- [ ] Implementar logs detalhados para depuração
- [ ] Verificar se há problemas de CORS ou bloqueio de cookies
- [ ] Implementar sistema de retry para falhas na API
- [ ] Estabelecer limites de tentativas para evitar sobrecarga
- [ ] Adicionar tratamento de erros adequado para todas as chamadas de API
- [ ] Confirmar que o fluxo de execução sempre prioriza a API sobre o Pixel

## 12. Otimização do Código

- [ ] Verificar se o código de rastreamento não afeta o desempenho do site
- [ ] Confirmar que os eventos são enviados de forma assíncrona
- [ ] Validar que a ordem de execução sempre inicia a API antes do Pixel
- [ ] Verificar se há condicionais para evitar envios desnecessários
- [ ] Confirmar que o código está minificado para produção
- [ ] Validar que o código funciona corretamente em navegadores mais antigos (se necessário)
- [ ] Verificar se o código de rastreamento é carregado de forma eficiente

## 13. Consistência na Implementação

- [ ] Confirmar que todos os eventos seguem o mesmo padrão de implementação
- [ ] Verificar se há consistência nos nomes de eventos e parâmetros
- [ ] Validar que os mesmos dados do usuário são enviados em todos os eventos
- [ ] Confirmar que o mesmo método de hasheamento é usado em todos os lugares
- [ ] Verificar se há reutilização de código para funções comuns
- [ ] Confirmar que todo evento segue a ordem consistente: primeiro API, depois Pixel

## 14. Sistema de Prevenção de Eventos Duplicados por Usuário

- [ ] Implementar sistema de armazenamento em localStorage/sessionStorage para rastrear eventos já enviados
- [ ] Criar função que verifica se o evento Lead já foi disparado pelo usuário atual na sessão ou navegador
- [ ] Criar função que verifica se o evento SubmitApplication já foi disparado pelo usuário atual na sessão ou navegador
- [ ] Criar função que verifica se o evento Contact já foi disparado pelo usuário atual na sessão ou navegador
- [ ] Criar função que verifica se o evento ViewContent já foi disparado pelo usuário atual para cada conteúdo específico
- [ ] Implementar validação antes de cada disparo de evento para verificar se já foi enviado anteriormente
- [ ] Adicionar timestamp para cada evento gravado para possível expiração (opcional)
- [ ] Implementar a mesma lógica de prevenção tanto para o Pixel quanto para a API de Conversões
- [ ] Verificar se o sistema de deduplicação funciona mesmo após recarregamento de página (para localStorage)
- [ ] Configurar sistema para distinguir entre diferentes formulários/conteúdos do mesmo tipo
- [ ] Adicionar variável de configuração para definir período de expiração da deduplicação (horas/dias)
- [ ] Implementar mecanismo para limpar dados antigos de eventos no storage
- [ ] Garantir que o sistema de deduplicação não interfere no rastreamento de usuários diferentes
- [ ] O Pageview pode acontecer mais de uma vez por usuário, mas nunca na mesma página

## 15. Implementação Específica para NextJS 14

- [ ] Configurar Meta Pixel para funcionar com Client Components e Server Components
- [ ] Implementar a inicialização do Pixel no arquivo layout.js ou app/layout.js usando use client para garantir carregamento em todas as páginas
- [ ] Utilizar a API de rota do NextJS para implementar os endpoints da Conversions API
- [ ] Configurar middleware para capturar dados de usuário necessários para a API de Conversões
- [ ] Implementar tratamento de Server-Side Rendering (SSR) para evitar disparos duplicados do Pixel
- [ ] Garantir que eventos de interação com componentes React sejam capturados corretamente
- [ ] Configurar Context API ou Redux para compartilhar o estado de eventos já disparados entre componentes
- [ ] Utilizar cookies com httpOnly para armazenar dados de rastreamento entre renderizações do servidor
- [ ] Implementar sistema de verificação de eventos duplicados que funcione com revalidação de cache do NextJS
- [ ] Configurar Next/Script para carregar o Meta Pixel com estratégia "afterInteractive"
- [ ] Utilizar next/headers para capturar e compartilhar dados de cabeçalho HTTP para a API de Conversões
- [ ] Implementar testes específicos para verificar a funcionalidade com App Router e Server Components
- [ ] Garantir que o código de rastreamento é compatível com a compilação estática (Static Generation)
- [ ] Verificar funcionamento correto durante navegações com o roteador do NextJS (sem recarregar página)
- [ ] Adaptar o sistema de deduplicação para funcionar corretamente com o modelo de hidratação do NextJS
- [ ] Utilizar React Server Actions para implementação da API de Conversões mantendo a segurança
- [ ] Garantir que eventos são capturados mesmo durante navegações com prefetching/shallow routing

## 16. Implementação NextJS Modular e Reutilizável

- [ ] Estruturar o código de rastreamento de forma que possa ser facilmente copiado entre projetos
- [ ] Implementar configuração via variáveis de ambiente para personalização em diferentes projetos
- [ ] Separar as responsabilidades: inicialização, rastreamento e deduplicação de eventos
- [ ] Adicionar comentários claros no código para facilitar implementação em novos projetos
- [ ] Criar funções reutilizáveis para normalização e hash de dados pessoais (emails, telefones)
- [ ] Implementar sistema de plugins para permitir extensões específicas para cada cliente/projeto
- [ ] Criar funções de utilidade separadas para normalização e hash de dados pessoais
- [ ] Desenvolver sistema de logs configurável que possa ser ativado/desativado conforme necessário
- [ ] Desenvolver sistema de prevenção de eventos duplicados que funcione através de diferentes domínios