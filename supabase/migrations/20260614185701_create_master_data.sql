create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facilities_name_not_blank
    check (length(trim(name)) > 0)
);

create unique index facilities_name_unique
on public.facilities (lower(name));

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_name_not_blank
    check (length(trim(name)) > 0)
);

create unique index rooms_facility_name_unique
on public.rooms (facility_id, lower(name));

create index rooms_facility_id_index
on public.rooms (facility_id);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number integer not null unique,
  legal_name text not null,
  preferred_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_number_positive
    check (employee_number > 0),
  constraint employees_legal_name_not_blank
    check (length(trim(legal_name)) > 0),
  constraint employees_preferred_name_not_blank
    check (preferred_name is null or length(trim(preferred_name)) > 0)
);

create trigger facilities_set_updated_at
before update on public.facilities
for each row
execute function public.set_updated_at();

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

create trigger employees_set_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

alter table public.facilities enable row level security;
alter table public.rooms enable row level security;
alter table public.employees enable row level security;

create policy "active users can read facilities"
on public.facilities
for select
to authenticated
using ((select public.is_active_user()));

create policy "admins can insert facilities"
on public.facilities
for insert
to authenticated
with check ((select public.is_admin()));

create policy "admins can update facilities"
on public.facilities
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "active users can read rooms"
on public.rooms
for select
to authenticated
using ((select public.is_active_user()));

create policy "admins can insert rooms"
on public.rooms
for insert
to authenticated
with check ((select public.is_admin()));

create policy "admins can update rooms"
on public.rooms
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "active users can read employees"
on public.employees
for select
to authenticated
using ((select public.is_active_user()));

create policy "admins can insert employees"
on public.employees
for insert
to authenticated
with check ((select public.is_admin()));

create policy "admins can update employees"
on public.employees
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke all on table public.facilities from anon;
revoke all on table public.rooms from anon;
revoke all on table public.employees from anon;

revoke all on table public.facilities from authenticated;
revoke all on table public.rooms from authenticated;
revoke all on table public.employees from authenticated;

grant select, insert, update on table public.facilities to authenticated;
grant select, insert, update on table public.rooms to authenticated;
grant select, insert, update on table public.employees to authenticated;
