-- Fila privada de limpeza de avatares. Armazena caminhos para reprocessar falhas de Storage.
-- Aplicada ao banco em 16/11/2026.
CREATE TABLE IF NOT EXISTS public.mesa_storage_exclusoes_pendentes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 storage_path text NOT NULL UNIQUE CHECK (char_length(storage_path) BETWEEN 1 AND 1024),
 criado_em timestamptz NOT NULL DEFAULT now(),
 tentativas integer NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
 ultima_tentativa timestamptz
);
CREATE INDEX IF NOT EXISTS mesa_storage_exclusoes_pendentes_criado_em_idx
 ON public.mesa_storage_exclusoes_pendentes(criado_em,id);
ALTER TABLE public.mesa_storage_exclusoes_pendentes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mesa_storage_exclusoes_pendentes FROM PUBLIC,anon,authenticated;
