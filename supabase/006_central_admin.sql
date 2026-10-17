-- Mesa / Central do Administrador v1. Executar uma única vez no SQL Editor do Supabase.
-- As rotas usam conexão privada PostgreSQL e verificam papel='admin' no servidor.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bloqueado_ate timestamptz;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_login_em timestamptz;

CREATE TABLE IF NOT EXISTS public.mesa_comunicados (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 titulo varchar(120) NOT NULL,
 corpo text NOT NULL CHECK (char_length(corpo) <= 3000),
 publicado boolean NOT NULL DEFAULT false,
 categoria varchar(24) NOT NULL DEFAULT 'novidade' CHECK (categoria IN ('novidade','aviso','manutencao')),
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mesa_conteudos (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 titulo varchar(120) NOT NULL,
 corpo text NOT NULL CHECK (char_length(corpo) <= 5000),
 tipo varchar(20) NOT NULL DEFAULT 'tutorial' CHECK (tipo IN ('tutorial','faq','exemplo')),
 publicado boolean NOT NULL DEFAULT false,
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mesa_chamados (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 assunto varchar(120) NOT NULL,
 mensagem text NOT NULL CHECK (char_length(mensagem) <= 2000),
 resposta text CHECK (char_length(resposta) <= 2000),
 status varchar(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','analise','resolvido')),
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mesa_config (
 chave varchar(60) PRIMARY KEY,
 valor text NOT NULL CHECK (char_length(valor) <= 1000),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.mesa_config(chave,valor)
VALUES ('aviso_site',''),('modo_manutencao','false')
ON CONFLICT (chave) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.mesa_auditoria (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 admin_id bigint REFERENCES public.usuarios(id) ON DELETE SET NULL,
 acao varchar(80) NOT NULL,
 alvo_tipo varchar(35),
 alvo_id bigint,
 detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
 criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mesa_comunicados_publicados ON public.mesa_comunicados(publicado,criado_em DESC);
CREATE INDEX IF NOT EXISTS mesa_conteudos_publicados ON public.mesa_conteudos(publicado,tipo,criado_em DESC);
CREATE INDEX IF NOT EXISTS mesa_chamados_usuario ON public.mesa_chamados(usuario_id,criado_em DESC);
CREATE INDEX IF NOT EXISTS mesa_auditoria_data ON public.mesa_auditoria(criado_em DESC);
-- Não disponibilizar leitura ou mutação direta via APIs públicas do Supabase.
ALTER TABLE public.mesa_comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_auditoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mesa_comunicados,public.mesa_conteudos,public.mesa_chamados,public.mesa_config,public.mesa_auditoria FROM anon,authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon,authenticated;
-- A aplicação deve usar um papel de banco confiável com permissões nas tabelas.
