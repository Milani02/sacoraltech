-- ============================================================
-- SAC Oraltech — nome do responsável visível ao cliente
--
-- BUG: o cliente sempre via "Não atribuído" no próprio ticket, mesmo
-- depois de um atendente assumir o caso. Causa: `profiles_select` só
-- libera o próprio perfil ou staff (`is_staff()`) — o cliente não tem
-- SELECT na linha do atendente responsável, então a resolução do
-- assignee em getTicket/listTickets vinha vazia. Mesma causa raiz do
-- bug corrigido na 0013 para o nome do autor da mensagem.
--
-- Fix: duas funções SECURITY DEFINER (mesmo padrão de
-- ticket_message_authors) que devolvem só o nome do responsável, e
-- apenas para tickets que o chamador já pode acessar
-- (can_access_ticket) — não expõe e-mail/papel do atendente.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

create or replace function public.ticket_assignee_name(p_ticket_id uuid)
returns text
language sql stable security definer set search_path = public as $$
  select p.full_name
  from public.tickets t
  join public.profiles p on p.id = t.assignee_id
  where t.id = p_ticket_id and public.can_access_ticket(p_ticket_id);
$$;

create or replace function public.ticket_assignee_names()
returns table (ticket_id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select t.id, p.full_name
  from public.tickets t
  join public.profiles p on p.id = t.assignee_id
  where public.can_access_ticket(t.id);
$$;

revoke all on function public.ticket_assignee_name(uuid) from public, anon;
revoke all on function public.ticket_assignee_names() from public, anon;
grant execute on function public.ticket_assignee_name(uuid) to authenticated;
grant execute on function public.ticket_assignee_names() to authenticated;
