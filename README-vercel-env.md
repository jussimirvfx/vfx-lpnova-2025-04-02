# Configuração de Variáveis de Ambiente no Vercel

Este documento explica como configurar as variáveis de ambiente necessárias para o pixel do Facebook no servidor Vercel.

## Variáveis do Facebook Pixel

O código do Facebook Pixel foi configurado para utilizar variáveis de ambiente em vez de valores hardcoded. Isso proporciona maior segurança e flexibilidade, permitindo ter diferentes IDs de pixel em ambientes de desenvolvimento e produção.

### Variáveis necessárias

- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`: ID do pixel utilizado no lado do cliente (frontend)
- `FACEBOOK_PIXEL_ID`: O mesmo ID do pixel, mas utilizado em APIs do servidor
- `META_API_ACCESS_TOKEN`: Token de acesso para a API de Conversão do Meta
- `META_TEST_EVENT_CODE`: Código de teste para a API de Conversão (ex: TEST63322)

## Como configurar no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com)
2. Selecione o projeto onde deseja configurar as variáveis
3. Vá para a aba "Settings"
4. No menu lateral, clique em "Environment Variables"
5. Adicione cada uma das variáveis acima com seus respectivos valores:

   - Nome: `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`  
     Valor: `seu-id-do-pixel`  
     Ambientes: Production, Preview, Development

   - Nome: `FACEBOOK_PIXEL_ID`  
     Valor: `seu-id-do-pixel`  
     Ambientes: Production, Preview, Development

   - Nome: `META_API_ACCESS_TOKEN`  
     Valor: `seu-token-de-acesso`  
     Ambientes: Production, Preview, Development

   - Nome: `META_TEST_EVENT_CODE`  
     Valor: `seu-codigo-de-teste`  
     Ambientes: Production, Preview, Development

6. Clique em "Save" para salvar as alterações

## Verificando a configuração

Após configurar as variáveis e fazer o deploy, você pode verificar se as variáveis estão funcionando corretamente:

1. Acesse o site em produção
2. Abra as ferramentas de desenvolvedor (F12)
3. Vá para a aba "Network"
4. Filtre por "facebook" ou "meta"
5. Verifique se as requisições para o pixel estão sendo enviadas com o ID correto

## Testando diferentes ambientes

Você pode configurar diferentes valores para cada ambiente:

- **Production**: ID do pixel real para produção
- **Preview**: ID do pixel de teste para pré-visualização
- **Development**: ID do pixel de teste para desenvolvimento local

Isso permite que você teste o rastreamento sem afetar os dados de produção.

## Sobre o META_TEST_EVENT_CODE

O código de teste (`META_TEST_EVENT_CODE`) é fornecido pelo Facebook para a validação de eventos durante a configuração da API de Conversão:

1. Este código muda periodicamente e pode precisar ser atualizado.
2. Você pode obter novos códigos de teste no Gerenciador de Eventos do Facebook, na seção de configuração da API de Conversão.
3. Quando o Facebook solicitar testes com um novo código, atualize apenas a variável de ambiente no Vercel - sem necessidade de alterar o código.

Para verificar o código atual ou obter um novo:
1. Acesse o [Facebook Business Manager](https://business.facebook.com)
2. Vá para "Eventos > Configuração"
3. Na seção "Test Events" você encontrará o código atual ou poderá gerar um novo 