-- ============================================================
-- SAC Oraltech — fluxo de status simplificado
--
-- 1) Remove o uso de 'open' e 'resolved' (ficam: new, in_progress,
--    waiting_client, closed). Os valores continuam no enum (remover
--    valor de enum exige recriar o tipo), mas as linhas são convertidas
--    e o app não os oferece mais.
-- 2) Status automático ao responder: mensagem pública de staff coloca o
--    ticket em 'waiting_client'; resposta pública do cliente devolve
--    para 'in_progress'. Notas internas e tickets fechados não mudam.
--    A troca manual pelo atendente continua disponível.
-- 3) Ticket fechado: cliente não pode mais comentar (só staff comenta
--    e pode reabrir mudando o status manualmente).
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

-- ---- (1) Converte linhas existentes ----
update public.tickets set status = 'in_progress' where status = 'open';
update public.tickets set status = 'closed'      where status = 'resolved';

-- closed_at passa a depender só de 'closed'.
create or replace function public.sync_ticket_closed_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := now();
  elsif new.status <> 'closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

-- ---- (2) Status automático quando uma mensagem pública é criada ----
-- SECURITY DEFINER: o cliente não tem UPDATE em tickets (RLS), mas a
-- transição automática precisa acontecer também quando ele responde.
create or replace function public.sync_ticket_status_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_status public.ticket_status;
  author_is_staff boolean;
begin
  if new.is_internal then
    return new;
  end if;

  select status into current_status from public.tickets where id = new.ticket_id;
  if current_status is null or current_status = 'closed' then
    -- Reabertura de ticket fechado é sempre manual, pelo atendente.
    return new;
  end if;

  select exists (
    select 1 from public.profiles p
    where p.id = new.author_id and p.role in ('admin', 'agent') and p.is_active
  ) into author_is_staff;

  if author_is_staff then
    if current_status <> 'waiting_client' then
      update public.tickets set status = 'waiting_client' where id = new.ticket_id;
    end if;
  elsif current_status = 'waiting_client' then
    update public.tickets set status = 'in_progress' where id = new.ticket_id;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_ticket_status_on_message() from public, anon;

drop trigger if exists trg_messages_sync_status on public.ticket_messages;
create trigger trg_messages_sync_status
  after insert on public.ticket_messages
  for each row execute function public.sync_ticket_status_on_message();

-- ---- (3) Cliente não comenta em ticket fechado ----
create or replace function public.ticket_is_closed(t_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tickets where id = t_id and status = 'closed'
  );
$$;

revoke all on function public.ticket_is_closed(uuid) from public, anon;
grant execute on function public.ticket_is_closed(uuid) to authenticated;

drop policy if exists "messages_insert" on public.ticket_messages;
create policy "messages_insert" on public.ticket_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_ticket(ticket_id)
    and (is_internal = false or public.is_staff())
    and (public.is_staff() or not public.ticket_is_closed(ticket_id))
  );
