alter table public.profiles
add column employee_id uuid unique
references public.employees (id)
on delete restrict;

comment on column public.profiles.employee_id is
  'Employee record linked to this login. Set by an administrator after account creation.';

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select employee_id
  from public.profiles
  where id = (select auth.uid())
    and active;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    join public.employees
      on employees.id = profiles.employee_id
    where profiles.id = (select auth.uid())
      and profiles.active
      and employees.active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    join public.employees
      on employees.id = profiles.employee_id
    where profiles.id = (select auth.uid())
      and profiles.active
      and employees.active
      and profiles.role = 'admin'
  );
$$;

create or replace function public.is_supervisor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    join public.employees
      on employees.id = profiles.employee_id
    where profiles.id = (select auth.uid())
      and profiles.active
      and employees.active
      and profiles.role in ('admin', 'supervisor')
  );
$$;

revoke all on function public.current_employee_id() from public;
revoke all on function public.is_supervisor_or_admin() from public;

grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.is_supervisor_or_admin() to authenticated;

drop policy "active users can read employees" on public.employees;

create policy "users can read permitted employee records"
on public.employees
for select
to authenticated
using (
  id = (select public.current_employee_id())
  or (select public.is_supervisor_or_admin())
);
