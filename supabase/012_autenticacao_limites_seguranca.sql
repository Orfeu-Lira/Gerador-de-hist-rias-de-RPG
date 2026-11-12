-- Mesa: limite persistente de tentativas de autenticação e recuperação.
-- Executado em produção em 12/11/2026; manter versionado para outros ambientes.
CREATE TABLE IF NOT EXISTS public.mesa_rate_limits (
  chave text PRIMARY KEY CHECK (length(chave) BETWEEN 10 AND 180),
  total integer NOT NULL DEFAULT 0 CHECK (total >= 0),
  expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS mesa_rate_limits_expira_idx ON public.mesa_rate_limits(expira_em);
ALTER TABLE public.mesa_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mesa_rate_limits FROM PUBLIC, anon, authenticated;
-- O backend usa o usuário de conexão PostgreSQL, não o cliente anon/authenticated.
-- Recuperação de senha: corrigir ambientes antigos que ainda não executaram 003.
CREATE TABLE IF NOT EXISTS public.redefinicoes_senha (
  token_hash text PRIMARY KEY,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS redefinicoes_senha_usuario_criado_idx
  ON public.redefinicoes_senha(usuario_id,criado_em DESC);
ALTER TABLE public.redefinicoes_senha ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.redefinicoes_senha FROM PUBLIC, anon, authenticated;
