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
