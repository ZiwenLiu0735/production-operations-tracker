create type public.session_status as enum (
  'active',
  'completed',
  'deleted'
);

create type public.work_type as enum (
  'trim',
  'hourly'
);

create type public.trim_category as enum (
  'regular',
  'stick',
  'smalls'
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete restrict,
  facility_name_snapshot text not null,
  work_type public.work_type not null,
  status public.session_status not null default 'active',
  strain text,
  bin_number text,
  tracking_uid text,
  notes text not null default '',
  started_at timestamptz not null default now(),
  started_by uuid not null references public.profiles (id) on delete restrict,
  ended_at timestamptz,
  ended_by uuid references public.profiles (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_facility_snapshot_not_blank
    check (length(trim(facility_name_snapshot)) > 0),
  constraint sessions_end_state_valid
    check (
      (status = 'active' and ended_at is null and ended_by is null)
      or
      (status in ('completed', 'deleted') and ended_at is not null and ended_by is not null)
    ),
  constraint sessions_delete_state_valid
    check (
      (status <> 'deleted' and deleted_at is null and deleted_by is null)
      or
      (status = 'deleted' and deleted_at is not null and deleted_by is not null)
    )
);

create table public.session_rooms (
  session_id uuid not null references public.sessions (id) on delete restrict,
  room_id uuid not null references public.rooms (id) on delete restrict,
  room_name_snapshot text not null,
  primary key (session_id, room_id),
  constraint session_rooms_name_snapshot_not_blank
    check (length(trim(room_name_snapshot)) > 0)
);

create table public.session_supervisors (
  session_id uuid not null references public.sessions (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete restrict,
  employee_number_snapshot integer not null,
  display_name_snapshot text not null,
  primary key (session_id, profile_id),
  unique (session_id, employee_id),
  constraint session_supervisors_number_positive
    check (employee_number_snapshot > 0),
  constraint session_supervisors_name_snapshot_not_blank
    check (length(trim(display_name_snapshot)) > 0)
);

create table public.session_employees (
  session_id uuid not null references public.sessions (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete restrict,
  employee_number_snapshot integer not null,
  legal_name_snapshot text not null,
  preferred_name_snapshot text,
  added_at timestamptz not null default now(),
  added_by uuid not null references public.profiles (id) on delete restrict,
  removed_at timestamptz,
  removed_by uuid references public.profiles (id) on delete restrict,
  primary key (session_id, employee_id),
  constraint session_employees_number_positive
    check (employee_number_snapshot > 0),
  constraint session_employees_legal_name_snapshot_not_blank
    check (length(trim(legal_name_snapshot)) > 0),
  constraint session_employees_preferred_name_snapshot_not_blank
    check (
      preferred_name_snapshot is null
      or length(trim(preferred_name_snapshot)) > 0
    ),
  constraint session_employees_remove_state_valid
    check (
      (removed_at is null and removed_by is null)
      or
      (removed_at is not null and removed_by is not null)
    )
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  employee_id uuid not null,
  category public.trim_category not null,
  weight_grams integer not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles (id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete restrict,
  foreign key (session_id, employee_id)
    references public.session_employees (session_id, employee_id)
    on delete restrict,
  constraint weight_entries_weight_positive
    check (weight_grams > 0),
  constraint weight_entries_delete_state_valid
    check (
      (deleted_at is null and deleted_by is null)
      or
      (deleted_at is not null and deleted_by is not null)
    )
);

create index sessions_facility_started_at_index
on public.sessions (facility_id, started_at desc);

create index sessions_status_started_at_index
on public.sessions (status, started_at desc);

create index session_rooms_room_id_index
on public.session_rooms (room_id);

create index session_supervisors_profile_id_index
on public.session_supervisors (profile_id, session_id);

create index session_employees_employee_id_index
on public.session_employees (employee_id, session_id);

create index weight_entries_session_recorded_at_index
on public.weight_entries (session_id, recorded_at);

create index weight_entries_employee_recorded_at_index
on public.weight_entries (employee_id, recorded_at desc)
where deleted_at is null;

create trigger sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

create trigger weight_entries_set_updated_at
before update on public.weight_entries
for each row
execute function public.set_updated_at();

create or replace function public.can_manage_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select public.is_admin())
    or (
      (select public.is_active_user())
      and exists (
        select 1
        from public.session_supervisors
        where session_id = target_session_id
          and profile_id = (select auth.uid())
      )
    );
$$;

create or replace function public.can_view_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select public.is_active_user())
    and (
      (select public.can_manage_session(target_session_id))
      or exists (
        select 1
        from public.session_employees
        where session_id = target_session_id
          and employee_id = (select public.current_employee_id())
      )
    );
$$;

create or replace function public.start_production_session(
  target_facility_id uuid,
  target_room_ids uuid[],
  target_supervisor_profile_ids uuid[],
  target_employee_ids uuid[],
  target_work_type public.work_type,
  target_strain text default null,
  target_bin_number text default null,
  target_tracking_uid text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile_id uuid := (select auth.uid());
  new_session_id uuid;
  expected_count integer;
  valid_count integer;
begin
  if not (select public.is_supervisor_or_admin()) then
    raise exception 'Only an active supervisor or admin can start a session';
  end if;

  if coalesce(cardinality(target_supervisor_profile_ids), 0) = 0 then
    raise exception 'At least one supervisor is required';
  end if;

  if not caller_profile_id = any(target_supervisor_profile_ids) then
    raise exception 'The user starting the session must be a selected supervisor';
  end if;

  if coalesce(cardinality(target_employee_ids), 0) = 0 then
    raise exception 'At least one employee is required';
  end if;

  if not exists (
    select 1
    from public.facilities
    where id = target_facility_id
      and active
  ) then
    raise exception 'Facility is missing or inactive';
  end if;

  select count(*) into expected_count
  from (select distinct unnest(coalesce(target_room_ids, array[]::uuid[]))) room_ids;

  select count(*) into valid_count
  from public.rooms
  where id = any(coalesce(target_room_ids, array[]::uuid[]))
    and facility_id = target_facility_id
    and active;

  if valid_count <> expected_count then
    raise exception 'One or more rooms are missing, inactive, or belong to another facility';
  end if;

  select count(*) into expected_count
  from (select distinct unnest(target_supervisor_profile_ids)) supervisor_ids;

  select count(*) into valid_count
  from public.profiles
  join public.employees
    on employees.id = profiles.employee_id
  where profiles.id = any(target_supervisor_profile_ids)
    and profiles.active
    and employees.active
    and profiles.role in ('admin', 'supervisor');

  if valid_count <> expected_count then
    raise exception 'One or more supervisors are invalid or inactive';
  end if;

  select count(*) into expected_count
  from (select distinct unnest(target_employee_ids)) employee_ids;

  select count(*) into valid_count
  from public.employees
  where id = any(target_employee_ids)
    and active;

  if valid_count <> expected_count then
    raise exception 'One or more employees are missing or inactive';
  end if;

  insert into public.sessions (
    facility_id,
    facility_name_snapshot,
    work_type,
    strain,
    bin_number,
    tracking_uid,
    started_by
  )
  select
    facilities.id,
    facilities.name,
    target_work_type,
    nullif(trim(target_strain), ''),
    nullif(trim(target_bin_number), ''),
    nullif(trim(target_tracking_uid), ''),
    caller_profile_id
  from public.facilities
  where facilities.id = target_facility_id
  returning id into new_session_id;

  insert into public.session_rooms (
    session_id,
    room_id,
    room_name_snapshot
  )
  select
    new_session_id,
    rooms.id,
    rooms.name
  from public.rooms
  where rooms.id in (
    select distinct unnest(coalesce(target_room_ids, array[]::uuid[]))
  );

  insert into public.session_supervisors (
    session_id,
    profile_id,
    employee_id,
    employee_number_snapshot,
    display_name_snapshot
  )
  select
    new_session_id,
    profiles.id,
    employees.id,
    employees.employee_number,
    coalesce(employees.preferred_name, employees.legal_name)
  from public.profiles
  join public.employees
    on employees.id = profiles.employee_id
  where profiles.id in (
    select distinct unnest(target_supervisor_profile_ids)
  );

  insert into public.session_employees (
    session_id,
    employee_id,
    employee_number_snapshot,
    legal_name_snapshot,
    preferred_name_snapshot,
    added_by
  )
  select
    new_session_id,
    employees.id,
    employees.employee_number,
    employees.legal_name,
    employees.preferred_name,
    caller_profile_id
  from public.employees
  where employees.id in (
    select distinct unnest(target_employee_ids)
  );

  return new_session_id;
end;
$$;

create or replace function public.add_session_employee(
  target_session_id uuid,
  target_employee_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  if not exists (
    select 1
    from public.sessions
    where id = target_session_id
      and status = 'active'
  ) then
    raise exception 'Session is not active';
  end if;

  insert into public.session_employees (
    session_id,
    employee_id,
    employee_number_snapshot,
    legal_name_snapshot,
    preferred_name_snapshot,
    added_by
  )
  select
    target_session_id,
    employees.id,
    employees.employee_number,
    employees.legal_name,
    employees.preferred_name,
    (select auth.uid())
  from public.employees
  where employees.id = target_employee_id
    and employees.active
  on conflict (session_id, employee_id)
  do update set
    employee_number_snapshot = excluded.employee_number_snapshot,
    legal_name_snapshot = excluded.legal_name_snapshot,
    preferred_name_snapshot = excluded.preferred_name_snapshot,
    added_at = now(),
    added_by = excluded.added_by,
    removed_at = null,
    removed_by = null;

  if not found then
    raise exception 'Employee is missing or inactive';
  end if;
end;
$$;

create or replace function public.remove_session_employee(
  target_session_id uuid,
  target_employee_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  if not exists (
    select 1
    from public.sessions
    where id = target_session_id
      and status = 'active'
  ) then
    raise exception 'Session is not active';
  end if;

  update public.session_employees
  set
    removed_at = now(),
    removed_by = (select auth.uid())
  where session_id = target_session_id
    and employee_id = target_employee_id
    and removed_at is null;

  if not found then
    raise exception 'Active session employee was not found';
  end if;
end;
$$;

create or replace function public.record_weight_entry(
  target_session_id uuid,
  target_employee_id uuid,
  target_category public.trim_category,
  target_weight_grams integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_entry_id uuid;
  caller_profile_id uuid := (select auth.uid());
begin
  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  if target_weight_grams <= 0 then
    raise exception 'Weight must be greater than zero';
  end if;

  if not exists (
    select 1
    from public.sessions
    join public.session_employees
      on session_employees.session_id = sessions.id
    where sessions.id = target_session_id
      and sessions.status = 'active'
      and sessions.work_type = 'trim'
      and session_employees.employee_id = target_employee_id
      and session_employees.removed_at is null
  ) then
    raise exception 'Employee is not active in this session';
  end if;

  insert into public.weight_entries (
    session_id,
    employee_id,
    category,
    weight_grams,
    recorded_by,
    updated_by
  )
  values (
    target_session_id,
    target_employee_id,
    target_category,
    target_weight_grams,
    caller_profile_id,
    caller_profile_id
  )
  returning id into new_entry_id;

  return new_entry_id;
end;
$$;

create or replace function public.update_weight_entry(
  target_entry_id uuid,
  target_category public.trim_category,
  target_weight_grams integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_session_id uuid;
begin
  select session_id into target_session_id
  from public.weight_entries
  where id = target_entry_id
    and deleted_at is null;

  if target_session_id is null then
    raise exception 'Weight entry was not found';
  end if;

  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  if target_weight_grams <= 0 then
    raise exception 'Weight must be greater than zero';
  end if;

  if not exists (
    select 1
    from public.sessions
    where id = target_session_id
      and status = 'active'
      and work_type = 'trim'
  ) then
    raise exception 'Session is not active';
  end if;

  update public.weight_entries
  set
    category = target_category,
    weight_grams = target_weight_grams,
    updated_by = (select auth.uid())
  where id = target_entry_id;
end;
$$;

create or replace function public.delete_weight_entry(target_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_session_id uuid;
begin
  select session_id into target_session_id
  from public.weight_entries
  where id = target_entry_id
    and deleted_at is null;

  if target_session_id is null then
    raise exception 'Weight entry was not found';
  end if;

  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  if not exists (
    select 1
    from public.sessions
    where id = target_session_id
      and status = 'active'
      and work_type = 'trim'
  ) then
    raise exception 'Session is not active';
  end if;

  update public.weight_entries
  set
    deleted_at = now(),
    deleted_by = (select auth.uid()),
    updated_by = (select auth.uid())
  where id = target_entry_id;
end;
$$;

create or replace function public.complete_production_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.can_manage_session(target_session_id)) then
    raise exception 'Not authorized to manage this session';
  end if;

  update public.sessions
  set
    status = 'completed',
    ended_at = now(),
    ended_by = (select auth.uid())
  where id = target_session_id
    and status = 'active';

  if not found then
    raise exception 'Active session was not found';
  end if;
end;
$$;

revoke all on function public.can_manage_session(uuid) from public;
revoke all on function public.can_view_session(uuid) from public;
revoke all on function public.start_production_session(
  uuid,
  uuid[],
  uuid[],
  uuid[],
  public.work_type,
  text,
  text,
  text
) from public;
revoke all on function public.add_session_employee(uuid, uuid) from public;
revoke all on function public.remove_session_employee(uuid, uuid) from public;
revoke all on function public.record_weight_entry(
  uuid,
  uuid,
  public.trim_category,
  integer
) from public;
revoke all on function public.update_weight_entry(
  uuid,
  public.trim_category,
  integer
) from public;
revoke all on function public.delete_weight_entry(uuid) from public;
revoke all on function public.complete_production_session(uuid) from public;

grant execute on function public.can_manage_session(uuid) to authenticated;
grant execute on function public.can_view_session(uuid) to authenticated;
grant execute on function public.start_production_session(
  uuid,
  uuid[],
  uuid[],
  uuid[],
  public.work_type,
  text,
  text,
  text
) to authenticated;
grant execute on function public.add_session_employee(uuid, uuid) to authenticated;
grant execute on function public.remove_session_employee(uuid, uuid) to authenticated;
grant execute on function public.record_weight_entry(
  uuid,
  uuid,
  public.trim_category,
  integer
) to authenticated;
grant execute on function public.update_weight_entry(
  uuid,
  public.trim_category,
  integer
) to authenticated;
grant execute on function public.delete_weight_entry(uuid) to authenticated;
grant execute on function public.complete_production_session(uuid) to authenticated;

alter table public.sessions enable row level security;
alter table public.session_rooms enable row level security;
alter table public.session_supervisors enable row level security;
alter table public.session_employees enable row level security;
alter table public.weight_entries enable row level security;

create policy "users can read permitted sessions"
on public.sessions
for select
to authenticated
using ((select public.can_view_session(id)));

create policy "users can read rooms for permitted sessions"
on public.session_rooms
for select
to authenticated
using ((select public.can_view_session(session_id)));

create policy "users can read supervisors for permitted sessions"
on public.session_supervisors
for select
to authenticated
using ((select public.can_view_session(session_id)));

create policy "users can read permitted session employees"
on public.session_employees
for select
to authenticated
using (
  employee_id = (select public.current_employee_id())
  or (select public.can_manage_session(session_id))
);

create policy "users can read permitted weight entries"
on public.weight_entries
for select
to authenticated
using (
  (
    employee_id = (select public.current_employee_id())
    or (select public.can_manage_session(session_id))
  )
  and deleted_at is null
);

revoke all on table public.sessions from anon;
revoke all on table public.session_rooms from anon;
revoke all on table public.session_supervisors from anon;
revoke all on table public.session_employees from anon;
revoke all on table public.weight_entries from anon;

revoke all on table public.sessions from authenticated;
revoke all on table public.session_rooms from authenticated;
revoke all on table public.session_supervisors from authenticated;
revoke all on table public.session_employees from authenticated;
revoke all on table public.weight_entries from authenticated;

grant select on table public.sessions to authenticated;
grant select on table public.session_rooms to authenticated;
grant select on table public.session_supervisors to authenticated;
grant select on table public.session_employees to authenticated;
grant select on table public.weight_entries to authenticated;
