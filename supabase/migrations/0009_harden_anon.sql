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
