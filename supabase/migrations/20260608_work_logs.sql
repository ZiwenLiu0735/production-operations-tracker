-- work_logs — single source of truth for all production tracking
-- Start Session inserts into public.sessions only.
-- Trim Track saves weight entries here immediately on category tap.

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  work_type text not null,
  category text not null,
  weight integer not null check (weight >= 0),
  created_at timestamptz not null default now()
);

create index if not exists work_logs_session_id_idx
  on public.work_logs (session_id);

create index if not exists work_logs_session_created_at_idx
  on public.work_logs (session_id, created_at);

create index if not exists work_logs_employee_id_idx
  on public.work_logs (employee_id);

create index if not exists work_logs_work_type_idx
  on public.work_logs (work_type);

comment on table public.work_logs is
  'All production entries. Trim uses category regular|stick|smalls with weight in grams.';

alter table public.work_logs enable row level security;

create policy "work_logs_select_anon"
  on public.work_logs for select
  to anon, authenticated
  using (true);

create policy "work_logs_insert_anon"
  on public.work_logs for insert
  to anon, authenticated
  with check (true);

create policy "work_logs_update_anon"
  on public.work_logs for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "work_logs_delete_anon"
  on public.work_logs for delete
  to anon, authenticated
  using (true);
