-- ============================================================
-- SAC Oraltech — schema completo (aplicar de uma vez no SQL Editor)
-- Gerado a partir das migrations 0001-0016 (0002_seed.sql fica de fora:
-- é dado de exemplo/demo, opcional, roda-se à parte se quiser).
-- ============================================================

-- ------------------------------------------------------------
-- >>> 0001_init.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — schema inicial (Fase 1)
-- Enums, tabelas, triggers e RLS.
-- Rode no Supabase: SQL Editor → cole este arquivo → Run.
-- ============================================================

-- ---- Extensions ----
create extension if not exists "pgcrypto";

-- ---- Enums ----
create type public.user_role as enum ('admin', 'agent', 'client');
create type public.ticket_status as enum (
  'new', 'open', 'in_progress', 'waiting_client', 'resolved', 'closed'
);
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---- Tables ----
create table public.sectors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Usuários da plataforma (1:1 com auth.users).
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  email      text not null,
  role       public.user_role not null default 'client',
  sector_id  uuid references public.sectors (id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solicitantes (podem ou não ter login).
create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  company      text,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create sequence public.ticket_code_seq start 1;

create table public.tickets (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null
                 default ('SAC-' || lpad(nextval('public.ticket_code_seq')::text, 6, '0')),
  title        text not null,
  description  text not null,
  requester_id uuid not null references public.clients (id) on delete restrict,
  sector_id    uuid not null references public.sectors (id) on delete restrict,
  assignee_id  uuid references public.profiles (id) on delete set null,
  status       public.ticket_status not null default 'new',
  priority     public.ticket_priority not null default 'medium',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  closed_at    timestamptz
);

create table public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete set null,
  body        text not null,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---- Indexes ----
create index on public.tickets (status);
create index on public.tickets (sector_id);
create index on public.tickets (assignee_id);
create index on public.tickets (requester_id);
create index on public.ticket_messages (ticket_id);
create index on public.clients (auth_user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- updated_at em profiles e tickets
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_tickets_updated
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Marca closed_at quando o chamado é fechado/resolvido e limpa ao reabrir
create or replace function public.sync_ticket_closed_at()
returns trigger language plpgsql as $$
begin
  if new.status in ('resolved', 'closed') and old.status not in ('resolved', 'closed') then
    new.closed_at := now();
  elsif new.status not in ('resolved', 'closed') then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_tickets_closed_at
  before update on public.tickets
  for each row execute function public.sync_ticket_closed_at();

-- Cria um profile automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Helpers (SECURITY DEFINER evita recursão de RLS)
-- ============================================================

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'agent') and is_active
  );
$$;

-- O usuário pode acessar o chamado se for staff ou for o solicitante.
create or replace function public.can_access_ticket(t_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
    or exists (
      select 1
      from public.tickets t
      join public.clients c on c.id = t.requester_id
      where t.id = t_id and c.auth_user_id = auth.uid()
    );
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.sectors         enable row level security;
alter table public.clients         enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_messages enable row level security;

-- ---- profiles ----
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---- sectors ----
create policy "sectors_select" on public.sectors
  for select to authenticated using (true);

create policy "sectors_insert_admin" on public.sectors
  for insert to authenticated with check (public.is_admin());

create policy "sectors_update_admin" on public.sectors
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "sectors_delete_admin" on public.sectors
  for delete to authenticated using (public.is_admin());

-- ---- clients ----
create policy "clients_select" on public.clients
  for select to authenticated
  using (public.is_staff() or auth_user_id = auth.uid());

create policy "clients_insert_staff" on public.clients
  for insert to authenticated with check (public.is_staff());

create policy "clients_update_staff" on public.clients
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "clients_delete_admin" on public.clients
  for delete to authenticated using (public.is_admin());

-- ---- tickets ----
create policy "tickets_select" on public.tickets
  for select to authenticated
  using (public.can_access_ticket(id));

create policy "tickets_insert" on public.tickets
  for insert to authenticated
  with check (
    public.is_staff()
    or exists (
      select 1 from public.clients c
      where c.id = requester_id and c.auth_user_id = auth.uid()
    )
  );

create policy "tickets_update_staff" on public.tickets
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "tickets_delete_admin" on public.tickets
  for delete to authenticated using (public.is_admin());

-- ---- ticket_messages ----
create policy "messages_select" on public.ticket_messages
  for select to authenticated
  using (
    public.can_access_ticket(ticket_id)
    and (is_internal = false or public.is_staff())
  );

create policy "messages_insert" on public.ticket_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_ticket(ticket_id)
    and (is_internal = false or public.is_staff())
  );

-- ============================================================
-- Grants — o RLS só é avaliado APÓS o privilégio de tabela.
-- Concedemos ao papel `authenticated`; o `anon` fica sem acesso
-- (o app sempre opera com sessão autenticada). O RLS filtra as linhas.
-- ============================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- ------------------------------------------------------------
-- >>> 0003_grants.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0004_self_service.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — autosserviço do cliente (Fase 5)
--
-- Permite que um usuário com perfil de cliente tenha um registro
-- em `clients` (solicitante) vinculado ao seu login, para que possa
-- abrir os próprios chamados respeitando o RLS.
--
-- Rode no SQL Editor do Supabase.
-- ============================================================

create or replace function public.ensure_my_client()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  prof record;
begin
  -- Já existe registro para este usuário?
  select id into cid from public.clients where auth_user_id = auth.uid();
  if cid is not null then
    return cid;
  end if;

  select full_name, email into prof from public.profiles where id = auth.uid();

  insert into public.clients (name, email, auth_user_id)
  values (
    coalesce(nullif(prof.full_name, ''), prof.email, 'Cliente'),
    coalesce(prof.email, ''),
    auth.uid()
  )
  returning id into cid;

  return cid;
end;
$$;

grant execute on function public.ensure_my_client() to authenticated;

-- ------------------------------------------------------------
-- >>> 0005_topics.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — tópicos do cliente + fila SAC Geral
--
-- O cliente abre o ticket escolhendo um "Assunto" (tópico). Não há
-- escolha de setor: tudo vai para a fila "SAC Geral". Campos extras
-- de cada tópico ficam em `details` (jsonb).
--
-- Rode no SQL Editor do Supabase.
-- ============================================================

-- Campos novos no ticket
alter table public.tickets
  add column if not exists topic text,
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Garante a fila geral e devolve o id (cria se não existir).
create or replace function public.sac_general_sector_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  select id into sid from public.sectors where name = 'SAC Geral' limit 1;
  if sid is null then
    insert into public.sectors (name, description)
    values ('SAC Geral', 'Fila geral de atendimento ao cliente')
    returning id into sid;
  end if;
  return sid;
end;
$$;

grant execute on function public.sac_general_sector_id() to authenticated;

-- ------------------------------------------------------------
-- >>> 0006_attachments.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0007_fix_tickets_insert_rls.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — correção da abertura de ticket pelo cliente (RLS)
--
-- Sintoma: cliente recebe "Não foi possível abrir o ticket". No banco o
-- INSERT em public.tickets retorna 42501 (row-level security). Atendente/
-- admin abrem normalmente.
--
-- Causa raiz (a real): NÃO era o WITH CHECK do INSERT. O app abre o ticket
-- com `.insert(...).select("id")`, ou seja INSERT ... RETURNING. No RETURNING
-- o Postgres aplica a policy de SELECT (`tickets_select`) na linha nova. Essa
-- policy usava `can_access_ticket(id)`, que RE-CONSULTA a própria tabela
-- `tickets` para descobrir o `requester_id`:
--
--     select 1 from tickets t join clients c on c.id = t.requester_id
--      where t.id = t_id and c.auth_user_id = auth.uid()
--
-- Mas a linha recém-inserida ainda NÃO está visível para essa sub-consulta
-- durante o RETURNING (o `select requester_id` interno volta NULL), então o
-- EXISTS dá falso e o SELECT reprova → 42501. O staff nunca via porque cai no
-- ramo is_staff() e nem chega na sub-consulta.
--
-- Correção: a policy de SELECT passa a checar a coluna `requester_id` DA
-- PRÓPRIA LINHA (já disponível, sem re-consultar tickets), via um helper
-- SECURITY DEFINER `owns_client`. Mesmo padrão é aplicado ao INSERT por
-- consistência. `can_access_ticket` continua existindo (mensagens e anexos a
-- usam a partir de OUTRAS tabelas, onde `tickets` está visível normalmente).
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

-- O usuário autenticado é dono deste registro de solicitante?
-- SECURITY DEFINER: ignora o RLS de `clients`; recebe o requester_id da
-- própria linha, então não depende de re-consultar `tickets`.
create or replace function public.owns_client(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients
    where id = c_id and auth_user_id = auth.uid()
  );
$$;

grant execute on function public.owns_client(uuid) to authenticated;

-- SELECT: staff OU o próprio cliente (dono do requester_id da linha).
-- ESTA é a correção do bug do RETURNING.
drop policy if exists "tickets_select" on public.tickets;
create policy "tickets_select" on public.tickets
  for select to authenticated
  using ( public.is_staff() or public.owns_client(requester_id) );

-- INSERT: mesma lógica, por consistência (evita também o RLS aninhado em
-- clients que a subconsulta crua original tinha).
drop policy if exists "tickets_insert" on public.tickets;
create policy "tickets_insert" on public.tickets
  for insert to authenticated
  with check ( public.is_staff() or public.owns_client(requester_id) );

-- ------------------------------------------------------------
-- >>> 0008_single_sector.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0009_harden_anon.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — hardening do papel anônimo (anon)
--
-- Achados:
--  1) anon tinha grants residuais REFERENCES/TRIGGER/TRUNCATE nas tabelas
--     (defaults do Supabase; não exploráveis via PostgREST, mas desnecessários).
--  2) Todas as funções tinham EXECUTE para PUBLIC (inclui anon). Isso permitia
--     que um ANÔNIMO (apenas com a anon key pública) chamasse RPCs — em especial
--     `ensure_my_client`, que faz INSERT em `clients`, criando cadastros-lixo
--     sem autenticação. Vulnerabilidade de escrita não-autenticada / poluição.
--
-- Correção: remover todo acesso do anon às tabelas e bloquear a execução das
-- funções por anon/PUBLIC, mantendo EXECUTE apenas para `authenticated` nas
-- funções usadas pelo RLS e pelo app. Triggers (handle_new_user, etc.) não
-- exigem EXECUTE do papel chamador, então podem ficar sem grant a anon/public.
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

-- (1) Remove qualquer privilégio de tabela do anon.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- (2) Bloqueia execução de TODAS as funções por anon e PUBLIC.
revoke all on function public.is_staff()                 from public, anon;
revoke all on function public.is_admin()                 from public, anon;
revoke all on function public.can_access_ticket(uuid)    from public, anon;
revoke all on function public.owns_client(uuid)          from public, anon;
revoke all on function public.ensure_my_client()         from public, anon;
revoke all on function public.sac_general_sector_id()    from public, anon;
revoke all on function public.handle_new_user()          from public, anon;
revoke all on function public.set_updated_at()           from public, anon;
revoke all on function public.sync_ticket_closed_at()    from public, anon;

-- (3) Garante EXECUTE para `authenticated` nas funções necessárias
--     (RLS chama is_staff/is_admin/can_access_ticket/owns_client; o app chama
--     ensure_my_client/sac_general_sector_id como usuário logado).
grant execute on function public.is_staff()              to authenticated;
grant execute on function public.is_admin()              to authenticated;
grant execute on function public.can_access_ticket(uuid) to authenticated;
grant execute on function public.owns_client(uuid)       to authenticated;
grant execute on function public.ensure_my_client()      to authenticated;
grant execute on function public.sac_general_sector_id() to authenticated;

-- ------------------------------------------------------------
-- >>> 0010_ticket_category.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0011_status_flow.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0012_remove_client_company.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0013_ticket_message_authors.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0014_remove_sectors.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- >>> 0015_prevent_role_escalation.sql
-- ------------------------------------------------------------
-- ============================================================
-- SAC Oraltech — impede auto-promoção de papel (privilege escalation)
--
-- BUG DE SEGURANÇA: a policy "profiles_update" libera UPDATE quando
-- `id = auth.uid()` (self-update, pensada para o usuário editar o
-- próprio nome em /perfil) OU `is_admin()`. Ela não trava QUAIS colunas
-- podem mudar — então qualquer usuário autenticado (inclusive um
-- "client") podia dar PATCH direto na REST API do Supabase (com a
-- própria anon key + o próprio token) e setar role='admin' ou
-- is_active=true nele mesmo, sem passar pela aplicação. Confirmado via
-- teste automatizado (QA de segurança do clone da Oraltech).
--
-- Fix: trigger BEFORE UPDATE que bloqueia mudança de `role`/`is_active`
-- por quem não é admin — funciona em conjunto com a policy existente,
-- sem precisar reescrevê-la. Auto-update de full_name continua liberado
-- (role/is_active permanecem iguais nesse caso, o trigger deixa passar).
--
-- Rode no SQL Editor do Supabase. Idempotente.
-- ============================================================

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Apenas administradores podem alterar o papel do usuário.';
    end if;
    if new.is_active is distinct from old.is_active then
      raise exception 'Apenas administradores podem ativar/desativar usuários.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_role_escalation() from public, anon;

drop trigger if exists trg_profiles_prevent_escalation on public.profiles;
create trigger trg_profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ============================================================
-- Hardening extra: bucket de anexos sem limite de tamanho no servidor
-- (só havia checagem de 25MB no client, contornável via API direta).
-- Já aplicado manualmente via Storage API neste projeto; mantido aqui
-- para reprodutibilidade em outros ambientes/clones.
-- ============================================================
update storage.buckets set file_size_limit = 26214400 where id = 'attachments';

-- ------------------------------------------------------------
-- >>> 0016_ticket_assignee_name.sql
-- ------------------------------------------------------------
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

