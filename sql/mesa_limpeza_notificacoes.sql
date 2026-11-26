ALTER TABLE public.mesa_avisos_conta ADD COLUMN IF NOT EXISTS dispensado_em timestamptz;
ALTER TABLE public.mesa_notificacoes_lidas ADD COLUMN IF NOT EXISTS dispensado_em timestamptz;
ALTER TABLE public.mesa_campanha_membros ADD COLUMN IF NOT EXISTS convite_criado_em timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS public.mesa_avisos_sociais_dispensados(
 usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 chave text NOT NULL CHECK (length(chave)<=120),
 criado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(usuario_id,chave)
);
ALTER TABLE public.mesa_avisos_sociais_dispensados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mesa_avisos_sociais_dispensados FROM anon,authenticated;