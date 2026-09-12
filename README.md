# Paróquia São José — Next.js + Supabase + Vercel

Versão oficial evoluída a partir do projeto que já estava em produção na Vercel.

## Arquitetura preservada
- Next.js 15 / React 19
- Supabase SSR
- Supabase Auth com `/login`
- Perfis `admin` e `editor` na tabela `profiles`
- RLS no banco
- GitHub `main` → deploy automático na Vercel

## Funcionalidades desta atualização
- Novo layout institucional aprovado, com a nova foto real da igreja.
- Pastorais dinâmicas: Liturgia, Guarda, Batismo, Idoso, Música, Dízimo, Saúde, Família, Pascom, Catequese e Mães que Oram pelos Filhos.
- Horários de missas atualizados e administráveis.
- Liturgia Diária automática por data via `liturgia.up.railway.app/v2`, com navegação entre dias e leitura em voz alta pelo navegador.
- Reflexão do Evangelho própria da Paróquia, administrável no Supabase.
- Dízimo com PIX e redirecionamento seguro para provedor externo de cartão; o site não armazena dados de cartão.
- Intenções de missa enviadas ao Supabase e acompanhadas no painel.
- Notícias dinâmicas e administráveis.
- Terço Virtual interativo com quatro mistérios, roteiro completo e leitura em voz alta.
- Transmissão ao Vivo via YouTube, com programação, status ao vivo e histórico.
- Área administrativa protegida para Horários, Pastorais, Notícias, Intenções, Liturgia, Transmissões e Configurações.

## IMPORTANTE — migração do Supabase antes do deploy
Execute no SQL Editor do projeto `paroquia-sao-jose` o arquivo:

`supabase/migrations/20260912_site_v4.sql`

A migração é incremental: não apaga as tabelas existentes. Ela acrescenta as colunas necessárias, cria `live_streams` e `donation_settings`, acrescenta políticas RLS e cadastra as pastorais e horários solicitados quando ainda não existirem.

## Variáveis na Vercel
Mantenha as variáveis já existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Nunca coloque `service_role`, senha do banco ou chaves secretas no frontend.

## Publicação
1. Execute a migração SQL no Supabase.
2. Substitua/atualize os arquivos do repositório GitHub com esta versão.
3. Faça commit na branch `main`.
4. A Vercel fará o deploy automaticamente.
5. Teste `/login`, `/admin`, `/liturgia`, `/terco-virtual`, `/transmissao`, `/dizimo`, `/intencoes` e `/pastorais`.

## Atualização v5 — autenticação e intenções
- Recuperação de senha pelo próprio site: `/recuperar-senha` → `/auth/callback` → `/nova-senha`.
- Intenções com escolha de PIX, cartão de crédito ou débito.
- Valor, chave PIX/QR e link seguro de cartão configuráveis em `/admin/configuracoes`.
- Controle administrativo de pagamento: pendente, pago, isento ou cancelado.
- Execute `supabase/migrations/20260912_site_v5_auth_pagamentos.sql` antes de testar os pagamentos.
