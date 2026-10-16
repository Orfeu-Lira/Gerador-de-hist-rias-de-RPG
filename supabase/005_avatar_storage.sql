-- Mesa: avatares privados por ficha. Execute no SQL Editor do Supabase.
-- Bucket PRIVADO: não tornar público nem liberar leitura anônima.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('mesa-avatares','mesa-avatares',false,393216,ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=393216,allowed_mime_types=ARRAY['image/webp'];

CREATE TABLE IF NOT EXISTS public.personagem_avatares (
 personagem_id BIGINT PRIMARY KEY REFERENCES public.personagens_dnd(id) ON DELETE CASCADE,
 storage_path TEXT NOT NULL,
 atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.personagem_avatares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.personagem_avatares FROM anon,authenticated;
-- Apenas o backend pode acessar este bucket usando a credencial secreta SERVICE ROLE.
-- Nunca inserir SUPABASE_SERVICE_ROLE_KEY no frontend.
