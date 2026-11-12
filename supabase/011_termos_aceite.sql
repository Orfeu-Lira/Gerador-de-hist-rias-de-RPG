-- Registro da ciência dos termos no ato de criação de uma conta, sem alteração de contas antigas.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS termos_aceitos_em timestamptz,
  ADD COLUMN IF NOT EXISTS termos_versao varchar(20);
COMMENT ON COLUMN public.usuarios.termos_aceitos_em IS 'Data em que usuário aceitou os termos durante cadastro web';
COMMENT ON COLUMN public.usuarios.termos_versao IS 'Versão dos termos aceita pelo usuário';
