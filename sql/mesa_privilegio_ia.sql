ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ia_ilimitada boolean NOT NULL DEFAULT false;
REVOKE SELECT(ia_ilimitada), INSERT(ia_ilimitada), UPDATE(ia_ilimitada) ON public.usuarios FROM anon, authenticated;
