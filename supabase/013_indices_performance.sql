-- Índices para consultas observadas no backend.
-- Executado em produção; versionado para previews/restaurações.
CREATE INDEX IF NOT EXISTS mesa_conteudos_publicados_atualizacao_idx
 ON public.mesa_conteudos(atualizado_em DESC) WHERE publicado=true;
CREATE INDEX IF NOT EXISTS aventuras_usuario_id_desc_idx
 ON public.aventuras(usuario_id,id DESC);
