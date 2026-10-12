# Bibly

Your personal wellness space. App de treino pessoal (PWA) feito com React + Vite.

- `npm install`
- `npm run dev`: abre em modo de desenvolvimento
- `npm run build`: gera a versão de produção em `dist/`

## Dados

- **Sem Supabase** (variáveis vazias): modo local, sem login; dados no localStorage e fotos no IndexedDB.
- **Com Supabase**: login por e-mail e senha. Os dados ficam na tabela `app_state` (um JSON por pessoa) e as fotos no bucket privado `photos` (`<user_id>/<id>.jpg`). O aparelho guarda uma cópia para abrir rápido.
  1. Rode `supabase/schema.sql` no SQL Editor.
  2. Configure na Vercel `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publishable).
  3. Em Authentication → URL Configuration, use o endereço do site como Site URL.

No primeiro login, o que estava salvo no aparelho em modo local é enviado para a conta.
