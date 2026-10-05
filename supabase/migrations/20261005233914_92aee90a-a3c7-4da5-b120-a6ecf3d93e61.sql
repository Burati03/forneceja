create table public.buscas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  termo text not null check (char_length(termo) between 2 and 600),
  criado_em timestamptz not null default now()
);
create index buscas_user_idx on public.buscas(user_id, criado_em desc);
alter table public.buscas enable row level security;
grant select, insert, delete on public.buscas to authenticated;
create policy "buscas own select" on public.buscas for select to authenticated using (user_id = auth.uid());
create policy "buscas own insert" on public.buscas for insert to authenticated with check (user_id = auth.uid());
create policy "buscas own delete" on public.buscas for delete to authenticated using (user_id = auth.uid());