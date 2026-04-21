-- ============================================================
-- 004_seat_enforcement_trigger.sql
-- Block INSERT / UPDATE when a school has reached its seat cap
-- or when the school subscription is inactive / expired.
-- ============================================================

create or replace function public.enforce_seat_limits()
returns trigger language plpgsql security definer as $$
declare
  v_school  public.schools%rowtype;
  v_count   integer;
begin
  -- Only enforce limits for students and teachers
  if new.role not in ('student', 'teacher') then
    return new;
  end if;

  -- Nothing to check if the user is not attached to a school
  if new.school_id is null then
    return new;
  end if;

  -- Fetch school record
  select * into v_school
  from public.schools
  where id = new.school_id;

  if not found then
    raise exception 'School % not found.', new.school_id;
  end if;

  -- Subscription must be active
  if v_school.status != 'active' then
    raise exception
      'School subscription is not active. Please renew your subscription to add users.';
  end if;

  if v_school.expires_at is not null and v_school.expires_at < now() then
    raise exception
      'School subscription expired on %. Please renew to add users.',
      v_school.expires_at::date;
  end if;

  -- Count existing users of the same role (excluding this row on UPDATE)
  select count(*) into v_count
  from public.users
  where school_id = new.school_id
    and role      = new.role
    and (tg_op = 'INSERT' or id != new.id);

  if new.role = 'student' and v_count >= v_school.student_limit then
    raise exception
      'Student seat limit reached (%). Upgrade your plan to enrol more students.',
      v_school.student_limit;
  end if;

  if new.role = 'teacher' and v_count >= v_school.teacher_limit then
    raise exception
      'Teacher seat limit reached (%). Upgrade your plan to add more teachers.',
      v_school.teacher_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_seat_limits_trigger on public.users;
create trigger enforce_seat_limits_trigger
  before insert or update on public.users
  for each row execute function public.enforce_seat_limits();
