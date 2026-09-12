# Paróquia São José — Atualização V5

Esta versão conclui duas áreas importantes do site:

1. Recuperação de senha do painel administrativo pelo próprio site.
2. Pagamento das intenções da Santa Missa por PIX, cartão de crédito ou débito.

## 1. Supabase — executar antes do upload do código

Abra **Supabase → SQL Editor → New query** e execute o arquivo:

`supabase/migrations/20260912_site_v5_auth_pagamentos.sql`

O script é incremental: não exclui registros existentes.

## 2. GitHub

Envie o conteúdo desta pasta para a raiz do repositório `paroquia-sao-jose`, substituindo os arquivos de mesmo nome, e faça commit na branch `main`.

Sugestão de mensagem do commit:

`Finaliza recuperação de senha e pagamentos das intenções`

A Vercel deverá publicar automaticamente.

## 3. Recuperação de senha

Depois do deploy, abra:

`https://paroquia-sao-jose.vercel.app/login`

Clique em **Esqueci minha senha**. O fluxo correto é:

`/recuperar-senha` → e-mail do Supabase → `/auth/callback` → `/nova-senha` → `/login`

Não reutilize o link antigo de recuperação enviado antes desta atualização.

## 4. Configurar valor e pagamentos das intenções

Após recuperar o acesso, abra:

`/admin/configuracoes`

Na seção **Intenções da Santa Missa**, informe:

- Valor da intenção (R$);
- Chave PIX;
- URL opcional do QR Code PIX;
- Link seguro do provedor para pagamento com cartão.

Se a chave PIX das intenções ficar vazia, o site usa a chave PIX geral do Dízimo.

## 5. Segurança dos cartões

O site não recebe nem armazena número do cartão, validade ou CVV. O botão de cartão abre o ambiente seguro do provedor configurado pela Paróquia.

## 6. Administração das intenções

Em `/admin/intencoes`, a Secretaria poderá controlar:

- situação da intenção: recebida, confirmada, celebrada ou arquivada;
- situação do pagamento: pendente, pago, isento ou cancelado;
- forma de pagamento: PIX, crédito ou débito;
- valor registrado da intenção.

## 7. Observação

Para confirmação **automática** do pagamento por cartão/PIX, será necessária uma segunda etapa de integração com a API do provedor escolhido (por exemplo, Mercado Pago ou PagBank), usando credenciais da conta da própria Paróquia. Esta versão já deixa o fluxo de cobrança e controle administrativo pronto sem armazenar dados sensíveis de cartão.
