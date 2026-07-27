-- ============================================================
-- SAC Oraltech — nome do autor da mensagem visível ao cliente
--
-- BUG: o cliente via as respostas da equipe assinadas como "Usuário"
-- (fallback genérico), porque `profiles_select` só libera o próprio
-- perfil ou staff (`is_staff()`) — o cliente não tem SELECT na linha do
-- atendente que respondeu, então a busca do nome do autor vinha vazia.
--
-- Fix: função SECURITY DEFINER que devolve só `id` e `full_name` dos
-- autores das mensagens de um ticket, e apenas para quem já pode acessar
-- aquele ticket (`can_access_ticket`) — não expõe e-mail/setor/papel do
-- atendente, só o nome de exibição.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

create or replace function public.ticket_message_authors(p_ticket_id uuid)
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name
  from public.profiles p
  where public.can_access_ticket(p_ticket_id)
    and p.id in (
      select tm.author_id from public.ticket_messages tm
      where tm.ticket_id = p_ticket_id
    );
$$;

revoke all on function public.ticket_message_authors(uuid) from public, anon;
grant execute on function public.ticket_message_authors(uuid) to authenticated;
