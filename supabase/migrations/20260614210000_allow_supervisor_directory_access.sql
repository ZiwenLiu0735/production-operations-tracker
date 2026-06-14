create policy "supervisors can read active supervisor profiles"
on public.profiles
for select
to authenticated
using (
  (select public.is_supervisor_or_admin())
  and active
  and employee_id is not null
  and role in ('admin', 'supervisor')
);

