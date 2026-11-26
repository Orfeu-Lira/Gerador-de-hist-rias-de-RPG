ALTER TABLE public.mesa_avisos_conta ADD COLUMN IF NOT EXISTS chave_evento text, ADD COLUMN IF NOT EXISTS dados jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.mesa_avisos_conta DROP CONSTRAINT IF EXISTS mesa_avisos_conta_tipo_check;
ALTER TABLE public.mesa_avisos_conta ADD CONSTRAINT mesa_avisos_conta_tipo_check CHECK(tipo IN ('ia_concedida','ia_revogada','ia_renovada','amizade_aceita','suporte_atualizado'));
CREATE UNIQUE INDEX IF NOT EXISTS mesa_avisos_conta_evento ON public.mesa_avisos_conta(usuario_id,chave_evento);
ALTER TABLE public.mesa_avisos_conta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mesa_avisos_conta FROM anon,authenticated;