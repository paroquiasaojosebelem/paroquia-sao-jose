# V6.14 — Carrossel de Destaques da Paróquia

## O que foi adicionado
- Carrossel automático na página inicial (troca a cada 6 segundos).
- Setas, indicadores e gesto de deslizar no celular.
- Dois formatos: **Foto + texto** e **Arte pronta**.
- Imagem opcional específica para celular.
- Programação por data de início e término.
- Ordem manual de exibição e ativação/desativação.
- Novo menu **Admin > Destaques**.
- Upload direto de imagens para o Supabase Storage (bucket `parish-banners`).

## Implantação
1. No Supabase, abra **SQL Editor > New query**.
2. Execute o arquivo `paroquia_sao_jose_migracao_v6_14_destaques.sql`.
3. Envie os arquivos desta versão ao repositório GitHub, substituindo os correspondentes.
4. Aguarde o deploy automático do Vercel.
5. Entre no painel: `/admin/destaques`.
6. Cadastre o primeiro banner.

## Tamanhos sugeridos
- Desktop: **1600 x 600 px**.
- Celular (opcional): **900 x 1100 px**.
- Máximo por imagem: **8 MB**.

## Observação
Se nenhum destaque estiver ativo dentro do período de exibição, a página inicial simplesmente não mostra o bloco do carrossel.
