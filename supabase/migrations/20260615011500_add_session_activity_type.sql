alter table public.sessions
add column activity_type text;

update public.sessions
set activity_type = work_type::text;

alter table public.sessions
alter column activity_type set default 'trim',
alter column activity_type set not null;

alter table public.sessions
add constraint sessions_activity_type_valid
check (
  activity_type in (
    'trim',
    'deleaf',
    'chop',
    'skirt',
    'package',
    'sorting',
    'hourly'
  )
);

create or replace function public.start_production_activity_session(
  target_facility_id uuid,
  target_room_ids uuid[],
  target_supervisor_profile_ids uuid[],
  target_employee_ids uuid[],
  target_activity_type text,
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
  target_tracking_mode public.work_type;
  new_session_id uuid;
begin
  if target_activity_type not in (
    'trim',
    'deleaf',
    'chop',
    'skirt',
    'package',
    'sorting'
  ) then
    raise exception 'Unsupported activity type';
  end if;

  target_tracking_mode := case
    when target_activity_type = 'trim' then 'trim'::public.work_type
    else 'hourly'::public.work_type
  end;

  new_session_id := public.start_production_session(
    target_facility_id,
    target_room_ids,
    target_supervisor_profile_ids,
    target_employee_ids,
    target_tracking_mode,
    target_strain,
    target_bin_number,
    target_tracking_uid
  );

  update public.sessions
  set activity_type = target_activity_type
  where id = new_session_id;

  return new_session_id;
end;
$$;

revoke all on function public.start_production_activity_session(
  uuid,
  uuid[],
  uuid[],
  uuid[],
  text,
  text,
  text,
  text
) from public;

revoke execute on function public.start_production_session(
  uuid,
  uuid[],
  uuid[],
  uuid[],
  public.work_type,
  text,
  text,
  text
) from authenticated;

grant execute on function public.start_production_activity_session(
  uuid,
  uuid[],
  uuid[],
  uuid[],
  text,
  text,
  text,
  text
) to authenticated;
