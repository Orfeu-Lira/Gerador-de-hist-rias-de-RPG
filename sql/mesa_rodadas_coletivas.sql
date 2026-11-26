ALTER TABLE public.mesa_campanha_membros ADD COLUMN IF NOT EXISTS disponivel boolean NOT NULL DEFAULT true;
ALTER TABLE public.mesa_campanhas_online ADD COLUMN IF NOT EXISTS ia_testes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.mesa_campanha_eventos ADD COLUMN IF NOT EXISTS passou_vez boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS teste_resultado jsonb;
