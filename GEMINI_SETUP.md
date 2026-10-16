# Mesa — implantação de testes (Vercel + Supabase + Gemini)

## Estado
A branch `feature/gemini-integration` contém API Express migrada para PostgreSQL e configuração inicial de Vercel. **Ainda precisa de testes de build, cookies e geração antes do merge**.

## 1 — Banco Supabase
As tabelas `usuarios`, `aventuras`, `testes_visitante` e `sessoes` foram criadas pelo usuário no SQL Editor.

**Obrigatório:** execute também `supabase/002_limites.sql` no SQL Editor para criar `geracoes_limite`, que registra limites de geração de maneira atômica.

Use o Transaction Pooler na porta 6543 para `DATABASE_URL`. A URL e a senha devem permanecer privadas.

## 2 — Variáveis secretas no Vercel (Preview)
- `DATABASE_URL`: string PostgreSQL do Transaction Pooler
- `GEMINI_API_KEY`: chave privada do Google AI Studio
- `FRONTEND_ORIGIN`: `https://orfeu-lira.github.io`
- `SESSION_SECRET`: valor aleatório com 32+ caracteres
- `ADMIN_BOOTSTRAP_TOKEN`: **outro** valor aleatório com 32+ caracteres, diferente do SESSION_SECRET
- `GEMINI_MODEL`: opcional, padrão `gemini-2.5-flash`

A chave Gemini nunca deve ir para o frontend nem para o GitHub. Coloque as variáveis em Preview e não compartilhe os valores.

## 3 — Deploy de Preview
Implante a branch `feature/gemini-integration` no Vercel. A entrada serverless é `api/index.js`; o roteamento está em `vercel.json`.
Teste primeiro:
- `GET /api/health` → `{"ok":true,"service":"mesa-api"}`
- `GET /api/db-health` → `{"ok":true,"database":"connected"}` somente em Preview
- `GET /api/eu` → objeto com `logado:false` e `restantes`

Se o build falhar, inspecione os logs do Vercel antes de prosseguir. Foi removido o package-lock.json obsoleto; regenere com `npm install` e faça commit do lockfile ao finalizar os testes.

## 4 — Integração com o site
Após testes, atualize `config.js` na branch correta com a URL real HTTPS da API Vercel. Não use URL inventada. Não publique a `main` até validar Preview.
O uso de cookies cross-site (GitHub Pages → Vercel) pode ser bloqueado por navegadores; testar cadastro/login em navegadores reais e avaliar hospedar UI/API sob o mesmo site se necessário.

## Cuidados
- A API usa controle diário de 5 solicitações por conta (UTC) e 1 tentativa por IP de visitante, mantido em PostgreSQL. Os limites não substituem proteção contra abuso avançado.
- A saída do Gemini depende de sua cota e modelo disponível.
- Nunca copie credenciais para issues, logs públicos ou o chat.
- O endpoint `/api/db-health` existe apenas para diagnóstico do ambiente Preview.
