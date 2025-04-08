## 14. Sistema de Prevenção de Eventos Duplicados por Usuário (Integrado com Sistema Meta)


- [ ] Implementar sistema de armazenamento em localStorage/sessionStorage para rastrear eventos GA4 já enviados
- [ ] Integrar com o sistema de deduplicação do Meta para reutilizar informações quando possível
- [ ] Criar função que verifica se o evento generate_lead já foi disparado pelo usuário atual (compatível com evento Lead do Meta)
- [ ] Criar função que verifica se o evento sign_up já foi disparado pelo usuário atual (compatível com evento SubmitApplication do Meta)
- [ ] Criar função que verifica se o evento contact já foi disparado pelo usuário atual (compatível com evento Contact do Meta)
- [ ] Criar função que verifica se o evento view_item já foi disparado pelo usuário atual (compatível com evento ViewContent do Meta)
- [ ] Implementar validação antes de cada disparo de evento para verificar se já foi enviado anteriormente
- [ ] Adicionar timestamp para cada evento gravado para possível expiração (opcional)
- [ ] Implementar a mesma lógica de prevenção tanto para o GA4 quanto para o Measurement Protocol
- [ ] Verificar se o sistema de deduplicação funciona mesmo após recarregamento de página (para localStorage)
- [ ] Configurar sistema para distinguir entre diferentes formulários/conteúdos do mesmo tipo
- [ ] Adicionar variável de configuração para definir período de expiração da deduplicação (horas/dias)
- [ ] Implementar mecanismo para limpar dados antigos de eventos no storage
- [ ] Garantir que o sistema de deduplicação não interfere no sistema de deduplicação do Meta nem no rastreamento de usuários diferentes
- [ ] O page_view pode acontecer mais de uma vez por usuário, mas nunca na mesma página (mesma regra do PageView do Meta)
- [ ] Estabelecer namespaces separados para armazenamento de dados de deduplicação do GA4 e Meta


## 15. Implementação Específica para NextJS 14 (Coexistindo com Meta Pixel)


- [ ] Configurar GA4 para funcionar com Client Components e Server Components, em paralelo ao Meta Pixel existente
- [ ] Implementar a inicialização do GA4 no mesmo componente ou camada onde o Meta Pixel é inicializado (layout.js ou app/layout.js)
- [ ] Utilizar a API de rota do NextJS para implementar os endpoints do Measurement Protocol separados da Conversions API
- [ ] Configurar middleware para capturar dados de usuário para ambos os sistemas de rastreamento, evitando duplicação de código
- [ ] Implementar tratamento de Server-Side Rendering (SSR) para evitar disparos duplicados do GA4, compatível com o tratamento do Meta
- [ ] Garantir que eventos de interação com componentes React disparem tanto eventos GA4 quanto Meta de forma independente
- [ ] Configurar Context API ou Redux para gerenciar o estado de eventos de ambos os sistemas de rastreamento
- [ ] Utilizar cookies com namespaces separados para armazenar dados de rastreamento de cada plataforma
- [ ] Implementar sistema unificado de verificação de eventos duplicados que funcione com revalidação de cache do NextJS
- [ ] Configurar Next/Script para carregar o GA4 com mesma estratégia do Meta Pixel ("afterInteractive")
- [ ] Utilizar next/headers para capturar dados de cabeçalho HTTP comum para ambos os sistemas
- [ ] Implementar testes específicos que verifiquem o funcionamento paralelo de ambos os sistemas de rastreamento
- [ ] Garantir que o código de rastreamento de ambos é compatível com a compilação estática (Static Generation)
- [ ] Verificar funcionamento correto durante navegações com o roteador do NextJS, assegurando que ambos os sistemas capturam os eventos
-## 12. Otimização do Código (Sistema Dual de Rastreamento)


- [ ] Verificar se o código de rastreamento combinado não afeta o desempenho do site
- [ ] Confirmar que os eventos de ambos os sistemas são enviados de forma assíncrona e não bloqueante
- [ ] Validar que a ordem de execução sempre prioriza as APIs de servidor antes dos eventos do navegador
- [ ] Verificar se há condicionais para evitar envios desnecessários e duplicação entre sistemas
- [ ] Confirmar que o código combinado está otimizado e minificado para produção
- [ ] Validar que o código funciona corretamente em navegadores mais antigos (se necessário)
- [ ] Verificar se os códigos de rastreamento são carregados de forma eficiente (bundle splitting)
- [ ] Confirmar que a estratégia de consent mode unificada gerencia corretamente ambos os sistemas
- [ ] Implementar sistema de controle de carga para evitar que os dois sistemas sobrecarreguem o navegador
- [ ] Utilizar debounce/throttle para eventos de alta frequência como scroll em ambos os sistemas
- [ ] Garantir inicialização em paralelo dos dois sistemas para evitar bloqueio da renderização


## 13. Consistência na Implementação (Dual Meta/GA4)


- [ ] Confirmar que todos os eventos seguem o mesmo padrão de implementação em ambos os sistemas
- [ ] Verificar se há mapeamento consistente entre nomes de eventos e parâmetros do Meta e GA4
- [ ] Validar que os mesmos dados do usuário são enviados em todos os eventos para ambas as plataformas
- [ ] Confirmar que os métodos de anonimização/hasheamento são compatíveis entre Meta e GA4 onde necessário
- [ ] Verificar se há reutilização de código para funções comuns entre os dois sistemas
- [ ] Confirmar que a ordem de execução é consistente (API/servidor antes dos eventos do navegador)
- [ ] Estabelecer convenção de nomenclatura para eventos personalizados que funcione em ambos os sistemas
- [ ] Definir padrão de mapeamento entre custom_data (Meta) e event_params (GA4)
- [ ] Garantir que mudanças em um sistema não quebrem o funcionamento do outro## 10. Validação da Qualidade dos Dados no Código (Integração Dual)


- [ ] Validar se a anonimização de dados no GA4 é compatível com o hasheamento do Meta onde necessário
- [ ] Verificar se os dados são preparados uma única vez e reutilizados em ambos os sistemas
- [ ] Confirmar que o client_id é consistente para os eventos do GA4, sem interferir no event_id do Meta
- [ ] Verificar se a normalização de dados (emails, telefones, etc.) compartilha a mesma lógica em ambos os sistemas
- [ ] Validar que os timestamps são coerentes entre os dois sistemas
- [ ] Confirmar que os dados de usuário são consistentemente tratados entre Meta e GA4
- [ ] Verificar se há funções comuns para preparação de dados usadas por ambos os sistemas


## 11. Diagnóstico e Solução de Problemas no Código (Sistema Dual)


- [ ] Implementar logs detalhados para depuração que identifiquem a origem (Meta ou GA4)
- [ ] Verificar se há problemas de CORS ou bloqueio de cookies que afetem ambos os sistemas
- [ ] Implementar sistema de retry para falhas no Measurement Protocol e CAPI
- [ ] Estabelecer limites de tentativas para evitar sobrecarga por ambos os sistemas
- [ ] Adicionar tratamento de erros adequado para todas as chamadas de API de ambos os sistemas
- [ ] Confirmar que falhas em um sistema não bloqueiam o outro
- [ ] Implementar sistema de fallback onde um sistema pode compensar falhas do outro
- [ ] Criar dashboard de monitoramento que mostre métricas de ambos os sistemas para comparação
- [ ] Implementar alertas para discrepâncias significativas entre métricas dos dois sistemas
- [ ] Estabelecer processo de validação periódica da sincronização entre os sistemas## 9. Evento video_progress (Equivalente ao VideoPlay do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de video_progress é disparado em paralelo à CAPI de VideoPlay
- [ ] Confirmar envio paralelo do evento video_progress nos mesmos marcos de progresso do Meta
- [ ] Verificar se event_params inclui todos os parâmetros relevantes:
 - [ ] video_title (equivalente ao content_name do Meta)
 - [ ] video_provider
 - [ ] video_status (equivalente ao video_status do Meta)
 - [ ] video_current_time (equivalente ao video_time do Meta)
 - [ ] video_duration (equivalente ao video_duration do Meta)
 - [ ] video_percent (equivalente ao video_percent do Meta)
- [ ] Validar se há deduplicação adequada entre eventos do Measurement Protocol e do GA4, em sincronia com Meta
- [ ] Confirmar que o evento não é disparado durante buffering ou pausa, mesma lógica do Meta
- [ ] Verificar se os eventos são enviados mesmo quando o vídeo está em modo de tela cheia


### GA4 no Navegador:


- [ ] Verificar se o evento dispara nos mesmos momentos que os eventos do Meta:
 - [ ] Início do vídeo (video_start, equivalente a "started" do Meta)
 - [ ] 25% assistido (video_progress com percent=25, equivalente a "25_watched" do Meta)
 - [ ] 50% assistido (video_progress com percent=50, equivalente a "50_watched" do Meta)
 - [ ] 75% assistido (video_progress com percent=75, equivalente a "75_watched" do Meta)
 - [ ] 100% assistido (video_complete, equivalente a "completed" do Meta)
- [ ] Confirmar que inclui video_title (título do vídeo, mesmo do Meta)
- [ ] Verificar se video_provider está definido para identificação da plataforma de vídeo
- [ ] Validar se video_status está sendo atualizado corretamente
- [ ] Confirmar que video_current_time está sendo enviado em segundos
- [ ] Verificar se video_duration está sendo enviado corretamente
- [ ] Validar que video_percent está sendo calculado e enviado precisamente (0-100)
- [ ] Confirmar que a lógica de deduplicação para reprodução de vídeos é consistente com a do Meta## 8. Evento sign_up (Equivalente ao SubmitApplication do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de sign_up é disparado em paralelo à CAPI de SubmitApplication
- [ ] Verificar se o evento sign_up é disparado APENAS para leads qualificados, em sincronia com o Meta
- [ ] Confirmar que o evento é disparado logo após o evento generate_lead, mesmo timing do SubmitApplication no Meta
- [ ] Verificar se event_params inclui:
 - [ ] value calculado pelo lead scoring (mesmo valor do evento generate_lead e do Meta)
 - [ ] currency_code (mesmo do evento generate_lead e do Meta)
 - [ ] item_name (equivalente ao content_name do Meta)
- [ ] Validar que o threshold de qualificação é o mesmo utilizado no sistema Meta
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios em sincronia com o Meta
- [ ] Confirmar que o formulário de apresentação também dispara o evento sign_up para leads qualificados, como no Meta


### GA4 no Navegador:


- [ ] Verificar se o evento dispara em sincronia com o SubmitApplication do Meta (APENAS para leads qualificados)
- [ ] Confirmar que o evento é disparado logo após o evento generate_lead quando a página carrega (mesmo do Meta)
- [ ] Validar se o value está sendo enviado de forma consistente com o evento generate_lead e com o Meta
- [ ] Verificar se currency_code está definido junto com value (ex: "BRL")
- [ ] Confirmar que não há múltiplos disparos na mesma sessão
- [ ] Validar que eventos de conversão no GA4 estão configurados em paridade com os do Meta
- [ ] Garantir que o evento sign_up também é disparado para o formulário de apresentação quando o lead é qualificado## 7. Evento generate_lead (Equivalente ao Lead do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de generate_lead é disparado em paralelo à CAPI de Lead
- [ ] Verificar se o evento generate_lead é disparado para TODOS os leads que submeteram formulários, mesmo timing do Meta
- [ ] Confirmar que o evento é disparado quando a página de obrigado/apresentação carrega, em sincronia com o Meta
- [ ] Verificar se event_params inclui:
 - [ ] lead_value calculado pelo lead scoring (mesmo valor usado no Meta)
 - [ ] currency_code (equivalente ao currency do Meta)
 - [ ] item_name (equivalente ao content_name do Meta)
 - [ ] qualification_status ("qualified" ou "unqualified", equivalente ao Meta)
- [ ] Validar que o sistema de pontuação (lead scoring) reutiliza a mesma lógica do Meta
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios em sincronia com o Meta
- [ ] Assegurar que o formulário de apresentação também dispare corretamente o evento generate_lead junto com Lead do Meta


### GA4 no Navegador:


- [ ] Verificar se o evento dispara quando a página de obrigado/apresentação carrega, em sincronia com o Lead do Meta
- [ ] Confirmar que o lead_value está sendo calculado e enviado em paridade com o Meta:
 - [ ] Leads qualificados: valor baseado no lead score (1-100)
 - [ ] Leads não qualificados: valor 0
- [ ] Verificar se currency_code está definido junto com lead_value (ex: "BRL")
- [ ] Confirmar que não há múltiplos disparos na mesma sessão
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios reutilizando lógica do Meta
- [ ] Garantir que o evento generate_lead é disparado para o formulário de apresentação com os mesmos critérios do Meta## 6. Evento contact (Equivalente ao Contact do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de contact é disparado em paralelo à CAPI de Contact
- [ ] Confirmar envio do evento contact no servidor nos mesmos momentos que o evento Meta
- [ ] Verificar se contém informações equivalentes às enviadas pelo Meta
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios usando dados já validados pelo Meta
- [ ] Validar que todos os dados do usuário disponíveis são enviados (anonimizados quando necessário)
- [ ] Confirmar que event_params inclui:
 - [ ] item_name (equivalente ao content_name do Meta)
 - [ ] item_category (se aplicável, equivalente ao content_category do Meta)
 - [ ] form_status (se aplicável, equivalente ao success_status do Meta)


### GA4 no Navegador:


- [ ] Verificar se o evento dispara ao submeter o formulário de WhatsApp, junto com o evento Contact do Meta
- [ ] Confirmar que captura parâmetros como item_name (ex: "Formulário WhatsApp")
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios em sincronia com o sistema Meta
- [ ] Verificar se o evento dispara antes do redirecionamento (se houver)
- [ ] Validar que não dispara em caso de falha na submissão do formulário
- [ ] Verificar se os parâmetros de contato são incluídos (anonimizados quando necessário)## 5. Evento view_item (Equivalente ao ViewContent do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de view_item é disparado em paralelo à CAPI de ViewContent
- [ ] Confirmar envio do evento view_item nos mesmos momentos que o ViewContent
- [ ] Verificar se event_params inclui os mesmos parâmetros:
 - [ ] item_name (equivalente ao content_name do Meta)
 - [ ] item_category (equivalente ao content_category do Meta)
 - [ ] item_id (se aplicável, equivalente ao content_ids do Meta)
- [ ] Validar sincronização temporal entre os dois sistemas
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios usando a mesma lógica do Meta
- [ ] Confirmar que o evento view_item é independente e não substitui os eventos generate_lead e sign_up


### GA4 no Navegador:


- [ ] Verificar se dispara corretamente na página /apresentacao, junto com o ViewContent do Meta
- [ ] Confirmar que contém item_name (equivalente ao content_name do Meta)
- [ ] Verificar se inclui item_category se aplicável (equivalente ao content_category do Meta)
- [ ] Validar que o disparo ocorre após o page_view
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios aproveitando a lógica do Meta
- [ ] Garantir que o evento view_item é tratado como um evento distinto dos eventos generate_lead e sign_up## 4. Evento scroll (Equivalente ao Scroll do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de scroll é disparado em paralelo à CAPI de Scroll
- [ ] Confirmar envio dos mesmos pontos de scroll definidos no sistema Meta
- [ ] Verificar se event_params inclui percent_scrolled (equivalente ao percent_scroll do Meta)
- [ ] Validar que os mesmos critérios de disparo são usados em ambos os sistemas


### GA4 no Navegador:


- [ ] Verificar se o evento dispara nos mesmos pontos de scroll definidos para o Meta (25%, 50%, 75%, 90%)
- [ ] Confirmar que os disparos são únicos (não repetidos ao rolar para cima e para baixo), consistente com o Meta
- [ ] Verificar se inclui o parâmetro percent_scrolled (equivalente ao percent_scroll do Meta)
- [ ] Validar que o evento só é enviado após o page_view, seguindo o mesmo fluxo do Meta Pixel## 3. Evento page_view (Equivalente ao PageView do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de page_view é disparado em paralelo à CAPI de PageView
- [ ] Confirmar envio via servidor sem bloquear o fluxo do Meta
- [ ] Verificar se o tempo entre o disparo do Measurement Protocol e do GA4 é mínimo
- [ ] Garantir que seja enviado apenas 1 vez por página, seguindo a mesma lógica do PageView Meta
- [ ] Verificar que todos os parâmetros universais estão sendo enviados (page_title, page_location, etc.)
- [ ] Confirmar que o evento inclui URL completa, título da página e path como parâmetros (reutilizando dados do Meta)
- [ ] Verificar se a referência (document.referrer) está sendo enviada quando disponível (mesma do Meta)
- [ ] Validar que o client_id é consistente entre Measurement Protocol e GA4 para deduplicação


### GA4 no Navegador:


- [ ] Verificar se o page_view dispara em todas as páginas em sincronização com PageView do Meta
- [ ] Confirmar que dispara imediatamente ao carregar a página sem bloquear o Meta Pixel
- [ ] Verificar se ocorre antes de qualquer outro evento GA4 na mesma página
- [ ] Garantir que seja enviado apenas 1 vez por página, usando a mesma lógica de controle do Meta Pixel
- [ ] Verificar que todos os parâmetros universais estão sendo enviados
- [ ] Confirmar que parâmetros enriquecidos como viewport_size, screen_resolution estão incluídos
- [ ] Verificar se a linguagem do navegador (navigator.language) está sendo enviada
- [ ] Validar que o client_id está sendo capturado corretamente
- [ ] Confirmar que não há disparos duplicados em mudanças de rota client-side em SPAs, usando a mesma lógica de controle do Meta Pixel# Checklist Exaustivo para Implementação de Rastreamento GA4 e GA4 Measurement Protocol (Coexistindo com Meta Pixel)
# Atualizado: 2025-04-08


> **Nota**: Não altere esse arquivo, ele é para consulta apenas. Este checklist considera que o sistema de rastreamento Meta Pixel/CAPI já está implementado.


## 1. Configuração Básica no Código (Coexistindo com Meta Pixel)


- [ ] Verificar se o tag GA4 está instalado corretamente no cabeçalho do site sem conflitar com o Meta Pixel existente
- [ ] Confirmar se o Measurement Protocol está configurado no servidor usando fluxos separados da Conversions API
- [ ] Verificar se ambos usam o mesmo Measurement ID para sincronização de dados
- [ ] Verificar se o Measurement Protocol está configurado para disparar em paralelo aos eventos da CAPI sem bloqueio mútuo
- [ ] Confirmar que o sistema de deduplicação está ativo (usando client_id consistente) e não interfere na deduplicação do Meta
- [ ] Verificar se o primeiro evento page_view do GA4 é disparado em sincronização com o PageView do Meta Pixel
- [ ] Verificar se o client_id está sendo corretamente gerado e armazenado, independente do fbp/fbc
- [ ] Validar que a versão do GA4 e Measurement Protocol em uso são as mais atuais
- [ ] Garantir que os scripts GA4 e Meta Pixel são carregados de forma assíncrona para não competirem por recursos


## 2. Parâmetros Universais (para TODOS os eventos com compatibilidade Meta)


### Measurement Protocol (parâmetros obrigatórios):


- [ ] Confirmar que a chamada do Measurement Protocol é iniciada em paralelo à Conversions API sem bloqueios
- [ ] Verificar se event_name está consistente com o GA4 e mapeado corretamente para equivalentes do Meta
- [ ] Confirmar que timestamp_micros está sincronizado com o GA4 e compatível com event_time do Meta
- [ ] Validar que non_personalized_ads está configurado corretamente considerando o consentimento já rastreado pelo Meta
- [ ] Verificar envio de client_id idêntico ao do GA4 para deduplicação, sem interferir na deduplicação do Meta
- [ ] Confirmar envio completo de user_properties em TODOS os eventos:
 - [ ] page_title (mesmo usado no Meta)
 - [ ] page_location (mesmo usado no Meta)
 - [ ] page_referrer (mesmo usado no Meta)
 - [ ] user_id (quando disponível, consistente com external_id do Meta)
 - [ ] user_language
 - [ ] client_id
- [ ] Implementar estrutura modular que permita reutilizar dados já normalizados pelo sistema Meta


### GA4 no Navegador:


- [ ] Verificar envio consistente de event_name em todos os eventos, em paralelo aos eventos Meta
- [ ] Confirmar captura e envio de client_id único para cada usuário, independente do fbp
- [ ] Validar envio de timestamp preciso em todos os eventos, sincronizado com os timestamps do Meta
- [ ] Confirmar que page_location está corretamente configurado em cada página (mesmo usado no Meta)
- [ ] Verificar se o client_id está sendo incluído em todos os eventos
- [ ] Confirmar se o session_id está sendo capturado e enviado quando necessário
- [ ] Garantir que os callbacks de eventos não interferem ou bloqueiam os callbacks do Meta Pixel


## 3. Evento page_view (Equivalente ao PageView do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de page_view é disparado em paralelo à CAPI de PageView
- [ ] Confirmar envio via servidor sem bloquear o fluxo do Meta
- [ ] Verificar se o tempo entre o disparo do Measurement Protocol e do GA4 é mínimo
- [ ] Garantir que seja enviado apenas 1 vez por página, seguindo a mesma lógica do PageView Meta
- [ ] Verificar que todos os parâmetros universais estão sendo enviados (page_title, page_location, etc.)
- [ ] Confirmar que o evento inclui URL completa, título da página e path como parâmetros (reutilizando dados do Meta)
- [ ] Verificar se a referência (document.referrer) está sendo enviada quando disponível (mesma do Meta)
- [ ] Validar que o client_id é consistente entre Measurement Protocol e GA4 para deduplicação


### GA4 no Navegador:


- [ ] Verificar se o page_view dispara em todas as páginas em sincronização com PageView do Meta
- [ ] Confirmar que dispara imediatamente ao carregar a página sem bloquear o Meta Pixel
- [ ] Verificar se ocorre antes de qualquer outro evento GA4 na mesma página
- [ ] Garantir que seja enviado apenas 1 vez por página, usando a mesma lógica de controle do Meta Pixel
- [ ] Verificar que todos os parâmetros universais estão sendo enviados
- [ ] Confirmar que parâmetros enriquecidos como viewport_size, screen_resolution estão incluídos
- [ ] Verificar se a linguagem do navegador (navigator.language) está sendo enviada
- [ ] Validar que o client_id está sendo capturado corretamente
- [ ] Confirmar que não há disparos duplicados em mudanças de rota client-side em SPAs, usando a mesma lógica de controle do Meta Pixel


## 4. Evento scroll (Equivalente ao Scroll do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de scroll é disparado em paralelo à CAPI de Scroll
- [ ] Confirmar envio dos mesmos pontos de scroll definidos no sistema Meta
- [ ] Verificar se event_params inclui percent_scrolled (equivalente ao percent_scroll do Meta)
- [ ] Validar que os mesmos critérios de disparo são usados em ambos os sistemas


### GA4 no Navegador:


- [ ] Verificar se o evento dispara nos mesmos pontos de scroll definidos para o Meta (25%, 50%, 75%, 90%)
- [ ] Confirmar que os disparos são únicos (não repetidos ao rolar para cima e para baixo), consistente com o Meta
- [ ] Verificar se inclui o parâmetro percent_scrolled (equivalente ao percent_scroll do Meta)
- [ ] Validar que o evento só é enviado após o page_view, seguindo o mesmo fluxo do Meta Pixel


## 5. Evento view_item (Equivalente ao ViewContent do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de view_item é disparado em paralelo à CAPI de ViewContent
- [ ] Confirmar envio do evento view_item nos mesmos momentos que o ViewContent
- [ ] Verificar se event_params inclui os mesmos parâmetros:
 - [ ] item_name (equivalente ao content_name do Meta)
 - [ ] item_category (equivalente ao content_category do Meta)
 - [ ] item_id (se aplicável, equivalente ao content_ids do Meta)
- [ ] Validar sincronização temporal entre os dois sistemas
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios usando a mesma lógica do Meta
- [ ] Confirmar que o evento view_item é independente e não substitui os eventos generate_lead e sign_up


### GA4 no Navegador:


- [ ] Verificar se dispara corretamente na página /apresentacao, junto com o ViewContent do Meta
- [ ] Confirmar que contém item_name (equivalente ao content_name do Meta)
- [ ] Verificar se inclui item_category se aplicável (equivalente ao content_category do Meta)
- [ ] Validar que o disparo ocorre após o page_view
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios aproveitando a lógica do Meta
- [ ] Garantir que o evento view_item é tratado como um evento distinto dos eventos generate_lead e sign_up


## 6. Evento contact (Equivalente ao Contact do Meta)


### Measurement Protocol:


- [ ] Confirmar que o Measurement Protocol de contact é disparado em paralelo à CAPI de Contact
- [ ] Confirmar envio do evento contact no servidor nos mesmos momentos que o evento Meta
- [ ] Verificar se contém informações equivalentes às enviadas pelo Meta
- [ ] Verificar se o sistema de deduplicação previne múltiplos envios usando dados já validados pelo Meta
- [