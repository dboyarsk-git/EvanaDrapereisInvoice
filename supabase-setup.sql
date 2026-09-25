create table if not exists public.evana_app_state (
  workspace_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.evana_app_state enable row level security;

drop policy if exists "evana_state_select" on public.evana_app_state;
drop policy if exists "evana_state_insert" on public.evana_app_state;
drop policy if exists "evana_state_update" on public.evana_app_state;

create policy "evana_state_select"
  on public.evana_app_state
  for select
  to anon, authenticated
  using (true);

create policy "evana_state_insert"
  on public.evana_app_state
  for insert
  to anon, authenticated
  with check (true);

create policy "evana_state_update"
  on public.evana_app_state
  for update
  to anon, authenticated
  using (true)
  with check (true);
