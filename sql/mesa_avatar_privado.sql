alter table public.personagens_dnd add column if not exists avatar_webp bytea check (avatar_webp is null or octet_length(avatar_webp) between 26 and 393216);
