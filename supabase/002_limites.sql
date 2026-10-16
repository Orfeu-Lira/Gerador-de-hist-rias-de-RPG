-- Execute no SQL Editor do Supabase (uma única vez).
-- Controle atômico das gerações para prevenir consumo ilimitado da API Gemini.
CREATE TABLE IF NOT EXISTS public.geracoes_limite (
  identificador TEXT PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0)
);
ALTER TABLE public.geracoes_limite ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.geracoes_limite FROM anon, authenticated;
-- O backend conecta diretamente com PostgreSQL usando credenciais privadas.
