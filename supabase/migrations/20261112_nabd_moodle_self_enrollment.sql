-- NABD Moodle self-enrollment: a narrowly scoped opt-in for five active academy courses.
-- Only authenticated students can enroll *themselves* in a course marked active.
-- No admin privileges, certificate issuance, exam result editing or cross-user writes.
begin;
create or replace function public.nabd_moodle_self_enroll(p_course_id uuid)
returns table(course_id uuid, enrollment_status text)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_student uuid := (select auth.uid());
begin
  if v_student is null or not exists (
    select 1 from public.profiles p
    where p.id = v_student and p.role = 'student'
  ) then
    raise exception 'STUDENT_ONLY';
  end if;
  if p_course_id is null or not exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.status = 'active'
  ) then
    raise exception 'COURSE_NOT_OPEN';
  end if;
  insert into public.enrollments(student_id,course_id,status,progress,enrolled_at)
  values (v_student,p_course_id,'active',0,now())
  on conflict (student_id,course_id) do nothing;
  return query
    select e.course_id,e.status
      from public.enrollments e
     where e.student_id = v_student and e.course_id = p_course_id;
end
$$;
revoke all on function public.nabd_moodle_self_enroll(uuid) from public,anon;
grant execute on function public.nabd_moodle_self_enroll(uuid) to authenticated;
commit;