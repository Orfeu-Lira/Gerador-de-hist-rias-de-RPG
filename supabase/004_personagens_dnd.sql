-- Mesa D&D 5e (2024): fichas privadas por usuário autenticado.
CREATE TABLE IF NOT EXISTS public.personagens_dnd (
 id BIGSERIAL PRIMARY KEY,
 usuario_id BIGINT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 nome VARCHAR(100) NOT NULL,
 dados JSONB NOT NULL,
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS personagens_dnd_usuario_idx ON public.personagens_dnd(usuario_id, atualizado_em DESC);
ALTER TABLE public.personagens_dnd ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.personagens_dnd FROM anon, authenticated;
-- Somente backend servidor usando credenciais privadas e filtro de usuario_id.
