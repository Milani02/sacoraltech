-- ============================================================
-- SAC Oraltech — remove coluna "empresa" do cliente
--
-- No sacbiodinamica (sistema compartilhado pelo grupo) o cliente tinha
-- uma coluna `company` (Oraltech/Biodinâmica/Injecta), porque um mesmo
-- SAC atendia as 3 empresas. Aqui o sistema já é dedicado só à Oraltech,
-- então o conceito de "empresa do cliente/ticket" não existe: some a
-- coluna em vez de deixá-la solta e sem uso.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

alter table public.clients
  drop column if exists company;
