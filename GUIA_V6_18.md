# V6.18 — Vela Virtual de São José

## Instalação
1. No Supabase, abra **SQL Editor** e execute `paroquia_sao_jose_migracao_v6_18_vela_virtual.sql`.
2. Confirme que o resultado final mostra `public | virtual_candles`.
3. Copie todos os arquivos e pastas deste pacote para a raiz do repositório, substituindo os existentes quando solicitado.
4. Commit sugerido: `V6.18 - Vela Virtual de São José`.
5. Aguarde o Vercel ficar **Ready**.

## Testes
- Abra `/vela-virtual` e acenda uma vela privada.
- Confirme que a vela aparece na capela como “Uma intenção particular”.
- Acenda uma vela pública e confirme que nome/intenção aparecem somente ao clicar nela.
- Abra `/admin/vela-virtual` e teste tornar pública/privada, ocultar/reativar e excluir.
- Confira o novo card em **Formação e Espiritualidade**, o atalho da Home e o item do menu principal.

## Privacidade
A tabela não concede SELECT ao visitante anônimo. A página pública recebe apenas dados sanitizados por RPC; intenções privadas não são expostas ao navegador.
