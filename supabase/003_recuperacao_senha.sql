-- Recuperação de senha do Mesa: executar no SQL Editor do Supabase antes de ativar o envio.
-- Nunca armazene o token original: apenas o resumo SHA-256.
CREATE TABLE IF NOT EXISTS public.redefinicoes_senha (
  token_hash TEXT PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS redefinicoes_senha_usuario_criado_idx
  ON public.redefinicoes_senha(usuario_id, criado_em DESC);
ALTER TABLE public.redefinicoes_senha ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.redefinicoes_senha FROM anon, authenticated;
