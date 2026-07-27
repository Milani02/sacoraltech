-- ============================================================
-- SAC Oraltech — corrige bootstrap do primeiro admin, bloqueado pela 0015
--
-- BUG introduzido pela 0015: a trigger de prevent_role_escalation checa
-- is_admin(), que depende de auth.uid() — só preenchido quando a chamada
-- passa pelo PostgREST com um JWT de usuário logado (role
-- "authenticated"). Chamadas com a service_role key (o jeito documentado
-- de promover o primeiro admin, inclusive no seed 0002_seed.sql) e
-- comandos rodados direto no SQL Editor caem no mesmo "sem admin logado"
-- e ficavam bloqueados — mesmo vindo de quem já tem acesso de servidor/
-- operador do projeto (fora do alcance de um usuário comum do app).
--
-- Fix: só aplica a trava quando a chamada vem de uma sessão de usuário
-- comum (auth.role() = 'authenticated'). Isso mantém bloqueado o ataque
-- original (usuário client/agent tentando se autopromover via PATCH
-- direto com o próprio token) e libera o bootstrap via service_role ou
-- SQL Editor. Também não afeta admin editando outro usuário pela tela
-- Usuários: nesse caso is_admin() já é true e a checagem nem entra.
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
  if auth.role() = 'authenticated' and not public.is_admin() then
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
