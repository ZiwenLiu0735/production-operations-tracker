create or replace function public.list_operator_employees()
returns table (
  id uuid,
  employee_number integer,
  legal_name text,
  preferred_name text,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    employees.id,
    employees.employee_number,
    employees.legal_name,
    employees.preferred_name,
    employees.active,
    employees.created_at,
    employees.updated_at
  from public.employees
  where (select public.is_supervisor_or_admin())
    and not exists (
      select 1
      from public.profiles
      where profiles.employee_id = employees.id
        and profiles.role in ('admin', 'supervisor')
    )
  order by employees.employee_number;
$$;

revoke all on function public.list_operator_employees() from public;
grant execute on function public.list_operator_employees() to authenticated;

