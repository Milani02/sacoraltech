-- ============================================================
-- SAC Oraltech — categoria interna do ticket (R1–R19)
--
-- Campo definido pelo atendente no detalhe do ticket (bloco staff).
-- Não é exibido para o cliente. Texto livre no banco; a UI restringe a
-- R1–R19 e o RLS de UPDATE (tickets_update_staff) garante que só staff grava.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================
alter table public.tickets
  add column if not exists category text;
