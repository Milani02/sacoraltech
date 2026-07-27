-- ============================================================
-- SAC Oraltech — seed de dados de exemplo (Fase 1)
--
-- PRÉ-REQUISITO: rode 0001_init.sql e crie o usuário admin em
-- Authentication → Add user (com "Auto Confirm"). O trigger criará
-- o profile dele automaticamente (role = client).
--
-- ANTES DE RODAR: troque o e-mail abaixo pelo e-mail do seu admin.
-- ============================================================

-- 1) Promove o primeiro usuário a administrador.
update public.profiles
set role = 'admin',
    full_name = coalesce(nullif(full_name, ''), 'Administrador')
where email = 'tin8nbio@gmail.com';

-- 2) Setores
insert into public.sectors (name, description) values
  ('Suporte Técnico', 'Problemas de produto e sistema'),
  ('Financeiro',      'Cobranças, notas e pagamentos'),
  ('Comercial',       'Vendas e relacionamento'),
  ('Logística',       'Entregas e devoluções')
on conflict do nothing;

-- 3) Clientes / solicitantes
insert into public.clients (name, email, phone, company) values
  ('Mariana Reis',     'mariana@fazendaverde.com', '(11) 98888-1010', 'Fazenda Verde'),
  ('João Pedro Alves', 'joao@agrosol.com',         '(19) 97777-2020', 'AgroSol'),
  ('Camila Nunes',     'camila@hortavida.com',      null,             'Horta Vida'),
  ('Lucas Martins',    'lucas@terraboa.com',       '(31) 96666-3030', 'Terra Boa')
on conflict do nothing;

-- 4) Chamados de exemplo (sem responsável; serão atribuídos na plataforma).
insert into public.tickets (title, description, requester_id, sector_id, status, priority)
select v.title, v.description, c.id, s.id, v.status::public.ticket_status, v.priority::public.ticket_priority
from (values
  ('Erro ao emitir segunda via de boleto',
   'A página retorna erro ao gerar a segunda via do boleto no portal.',
   'mariana@fazendaverde.com', 'Financeiro', 'in_progress', 'high'),
  ('Pedido entregue com itens faltando',
   'Pedido chegou sem 2 dos 5 itens listados na nota fiscal.',
   'joao@agrosol.com', 'Logística', 'open', 'urgent'),
  ('Dúvida sobre plano de assinatura',
   'Gostaria de entender a diferença entre os planos Essencial e Pro.',
   'camila@hortavida.com', 'Comercial', 'new', 'low'),
  ('Sistema lento no horário de pico',
   'Entre 9h e 11h o painel fica lento para carregar relatórios.',
   'lucas@terraboa.com', 'Suporte Técnico', 'waiting_client', 'medium')
) as v(title, description, requester_email, sector_name, status, priority)
join public.clients c on c.email = v.requester_email
join public.sectors s on s.name = v.sector_name;
