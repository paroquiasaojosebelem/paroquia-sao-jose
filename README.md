# Paróquia São José — Next.js + Supabase + Vercel

Versão 3: base de produção iniciada a partir do layout aprovado.

## Já conectado
- Next.js App Router
- Supabase SSR
- Login real em `/login`
- Proteção do `/admin` por sessão + perfil `admin/editor`
- Home lendo `mass_schedule` do Supabase
- Página `/horarios` lendo horários reais
- WhatsApp da Secretaria
- Espaço de transmissão ao vivo pelo YouTube preparado no layout

## Configuração local
1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a Publishable Key do projeto.
3. Execute `npm install` e `npm run dev`.

## Vercel
Ao importar o projeto na Vercel, cadastre em Settings > Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Nunca coloque `service_role`, secret key ou senha do banco no frontend.

## Próximos módulos
Edição de horários, agenda, notícias, intenções, liturgia, festividade, galeria, Storage e transmissão YouTube.
