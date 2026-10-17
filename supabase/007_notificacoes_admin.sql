-- Mesa: leitura individual de avisos de suporte pelos administradores.
-- Não copia mensagens privadas; apenas registra quais chamados cada admin já visualizou.
CREATE TABLE IF NOT EXISTS public.mesa_notificacoes_lidas (
 administrador_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 chamado_id bigint NOT NULL REFERENCES public.mesa_chamados(id) ON DELETE CASCADE,
 lido_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (administrador_id,chamado_id)
);
CREATE INDEX IF NOT EXISTS mesa_notificacoes_lidas_por_chamado ON public.mesa_notificacoes_lidas(chamado_id);
ALTER TABLE public.mesa_notificacoes_lidas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mesa_notificacoes_lidas FROM anon, authenticated;
