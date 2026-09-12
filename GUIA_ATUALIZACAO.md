# GUIA DE ATUALIZAÇÃO — PARÓQUIA SÃO JOSÉ

## Ordem segura

1. **Não apague o projeto atual** da Vercel, GitHub ou Supabase.
2. No Supabase `paroquia-sao-jose`, abra **SQL Editor**.
3. Copie e execute `supabase/migrations/20260912_site_v4.sql`.
4. Confirme no Table Editor que surgiram `live_streams` e `donation_settings`.
5. Confirme que as 11 pastorais foram cadastradas e que os horários solicitados estão presentes.
6. No GitHub `paroquiasaojosebelem/paroquia-sao-jose`, atualize os arquivos com o conteúdo deste pacote e faça commit na branch **main**.
7. A Vercel fará novo deploy automaticamente.
8. Depois do status **Ready**, teste o site público e a administração.

## Primeiro teste da área administrativa

Acesse `/login` com o usuário administrativo que já existe no Supabase Auth. O painel permanece protegido por sessão + perfil `admin/editor` ativo.

## Configure depois do deploy

### Dízimo
Em **Administração > Configurações** informe:
- chave PIX;
- URL de imagem/QR Code PIX, se desejar;
- link de pagamento seguro para cartão (Mercado Pago, PagSeguro ou outro provedor escolhido pela Paróquia).

O site **não coleta nem armazena número de cartão**.

### Transmissão ao Vivo
Em **Administração > Transmissões** cadastre:
- título;
- link do YouTube;
- data e hora;
- status: Programada, Ao vivo ou Encerrada.

### Liturgia
As leituras são buscadas automaticamente conforme a data. Em **Administração > Liturgia**, a Paróquia pode acrescentar a reflexão própria do Evangelho.

### Notícias
Em **Administração > Notícias**, publique, edite, desative ou exclua notícias.

### Intenções
Os pedidos enviados no formulário público aparecem em **Administração > Intenções** para conferência da Secretaria.

## Páginas novas/atualizadas
- `/pastorais`
- `/horarios`
- `/liturgia`
- `/terco-virtual`
- `/transmissao`
- `/dizimo`
- `/intencoes`
- `/noticias`
- `/contato`
- `/admin`

## Observação de segurança
Nunca coloque `service_role`, senha do banco ou chave secreta em arquivos do GitHub ou em variáveis `NEXT_PUBLIC_*`.
