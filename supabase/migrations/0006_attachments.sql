-- ============================================================
-- SAC Oraltech — anexos (arquivos)
--
-- Tabela de metadados + bucket privado no Storage. O acesso usa
-- can_access_ticket() (mesma regra do ticket). Arquivos são guardados
-- no caminho `{ticket_id}/{uuid}.{ext}`.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.ticket_attachments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  message_id  uuid references public.ticket_messages (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  field_label text,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);

create index if not exists ticket_attachments_ticket_idx on public.ticket_attachments (ticket_id);
create index if not exists ticket_attachments_message_idx on public.ticket_attachments (message_id);

alter table public.ticket_attachments enable row level security;

create policy "attachments_select" on public.ticket_attachments
  for select to authenticated
  using (public.can_access_ticket(ticket_id));

create policy "attachments_insert" on public.ticket_attachments
  for insert to authenticated
  with check (public.can_access_ticket(ticket_id) and uploaded_by = auth.uid());

create policy "attachments_delete_staff" on public.ticket_attachments
  for delete to authenticated
  using (public.is_staff());

grant select, insert, delete on public.ticket_attachments to authenticated;

-- ---- Storage ----
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_obj_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.can_access_ticket(((storage.foldername(name))[1])::uuid)
  );

create policy "attachments_obj_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.can_access_ticket(((storage.foldername(name))[1])::uuid)
  );
