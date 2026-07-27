-- ============================================================
-- SAC Oraltech — fila única "SAC Geral"
--
-- A operação passou a usar apenas o setor "SAC Geral". Esta migration
-- reassocia qualquer ticket de outro setor para o SAC Geral e remove os
-- demais setores. `profiles.sector_id` zera sozinho (on delete set null);
-- `tickets.sector_id` é on delete restrict, por isso o update vem antes.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================
do $$
declare sac uuid;
begin
  select public.sac_general_sector_id() into sac;
  update public.tickets set sector_id = sac where sector_id <> sac;
  delete from public.sectors where id <> sac;
end $$;
