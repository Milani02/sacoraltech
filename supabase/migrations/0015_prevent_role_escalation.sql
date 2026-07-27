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
