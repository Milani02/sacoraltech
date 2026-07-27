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
