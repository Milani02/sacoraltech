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
