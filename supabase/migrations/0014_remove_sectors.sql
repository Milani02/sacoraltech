-- ============================================================
-- SAC Oraltech — remove setores
--
-- Não existe divisão por setor/área: todo ticket vai para a mesma fila,
-- atendida por qualquer atendente (papel "agent"). A tabela `sectors` e a
-- coluna `sector_id` (em tickets e profiles) ficaram sem uso depois da
-- 0008 (fila única "SAC Geral") — agora removidas de vez.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

alter table public.tickets  drop column if exists sector_id;
alter table public.profiles drop column if exists sector_id;

drop table if exists public.sectors cascade;

drop function if exists public.sac_general_sector_id();
