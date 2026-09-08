-- Tabela que guarda os dados do site (uma unica linha com o JSON completo).
-- Este SQL pode ser rodado varias vezes sem dar erro (e seguro rodar de novo).

create table if not exists public.site_data (
    id integer primary key default 1 check (id = 1),
    payload jsonb not null,
    updated_at timestamptz not null default now()
);

-- Insere a linha inicial vazia (se ainda nao existir)
insert into public.site_data (id, payload) values (1, '{}')
on conflict (id) do nothing;

-- habilita RLS (rodar de novo nao quebra nada)
alter table public.site_data enable row level security;

-- Leitura publica liberada (todos os visitantes podem ver)
drop policy if exists "site_data_select_public" on public.site_data;
create policy "site_data_select_public"
    on public.site_data for select
    using (true);

-- NENHUMA politica de insert/update/delete publica.
-- A escrita so acontece atraves da Edge Function save-data,
-- que usa a service role key (nunca exposta no frontend).