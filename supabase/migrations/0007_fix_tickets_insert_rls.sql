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
