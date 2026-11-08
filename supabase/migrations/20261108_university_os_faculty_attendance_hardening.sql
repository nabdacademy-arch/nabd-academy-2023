-- NABD OS V20/V22: synchronise existing faculty studio and harden attendance records.
-- Additive to 20261108_university_os_v17_v22.sql and the existing teaching studio migration.
begin;
create function public.nabd_os_assign_faculty(
  p_course_id uuid,p_lecturer_id uuid,p_active boolean default true
) returns boolean language plpgsql security definer set search_path='' as $body$
declare uid uuid := (select auth.uid()); lecturer_name text;
begin
  if uid is null or not public.is_admin() then raise exception 'Administrator required'; end if;
  if not exists(select 1 from public.courses where id=p_course_id) then raise exception 'Unknown course'; end if;
  select nullif(btrim(full_name),'') into lecturer_name from public.profiles where id=p_lecturer_id;
  if not found then raise exception 'Lecturer account not found'; end if;
  insert into public.nabd_os_faculty_assignments(course_id,lecturer_id,assigned_by,active)
    values(p_course_id,p_lecturer_id,uid,p_active)
    on conflict(course_id,lecturer_id) do update
      set assigned_by=excluded.assigned_by,active=excluded.active;
  insert into public.nabd_teaching_assignments(course_id,lecturer_id,display_name,active)
    values(p_course_id::text,p_lecturer_id,coalesce(lecturer_name,'NABD Lecturer'),p_active)
    on conflict(lecturer_id,course_id) do update
      set active=excluded.active,display_name=excluded.display_name;
  insert into public.nabd_os_audit_events(actor_id,event_type,object_type,object_id,detail)
    values(uid,'faculty_assignment_updated','faculty_assignment',p_course_id,
      jsonb_build_object('lecturer_id',p_lecturer_id,'active',p_active));
  return true;
end;
$body$;
revoke all on function public.nabd_os_assign_faculty(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.nabd_os_assign_faculty(uuid,uuid,boolean) to authenticated;

create function public.nabd_os_validate_attendance()
returns trigger language plpgsql security definer set search_path='' as $body$
begin
  if TG_OP='UPDATE' then
    if new.student_id is distinct from old.student_id
       or new.course_id is distinct from old.course_id
       or new.module_id is distinct from old.module_id
       or new.id is distinct from old.id then
      raise exception 'Attendance subject and course identifiers cannot change';
    end if;
    new.recorded_at:=now();
  end if;
  if not exists(select 1 from public.nabd_os_course_modules m
    where m.id=new.module_id and m.course_id=new.course_id) then
    raise exception 'Attendance module must belong to course';
  end if;
  if not exists(select 1 from public.enrollments e
    where e.course_id=new.course_id and e.student_id=new.student_id
      and e.status in ('enrolled','active','completed')) then
    raise exception 'Active course enrolment required';
  end if;
  return new;
end;
$body$;
revoke all on function public.nabd_os_validate_attendance() from public,anon,authenticated;
create trigger nabd_os_attendance_integrity before insert or update on public.nabd_os_attendance
for each row execute function public.nabd_os_validate_attendance();
commit;