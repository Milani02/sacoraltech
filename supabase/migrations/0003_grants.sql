-- ============================================================
-- SAC Oraltech — grants para o papel `authenticated`
--
-- Rode ISTO se você aplicou o 0001 antes desta correção
-- (sintoma: "permission denied for table ..." mesmo logado).
-- É idempotente — pode rodar sem medo.
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
