-- Reproducible V22 hardening of authorised attendance roster.
-- Deployed in Supabase as university_os_v22_secure_course_roster.
-- Return only the minimum fields needed for attendance, never student emails or phones.
create or replace function public.nabd_os_course_roster(p_course_id uuid)
returns table(student_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not (
    (select public.is_admin())
    or exists (
      select 1 from public.nabd_os_faculty_assignments fa
      where fa.course_id=p_course_id and fa.lecturer_id=caller and fa.active
    )
  ) then raise exception 'Course access denied'; end if;
  return query
  select e.student_id, left(coalesce(nullif(btrim(pr.full_name),''),'Student'),160)
  from public.enrollments e
  join public.profiles pr on pr.id=e.student_id
  where e.course_id=p_course_id and e.status in ('enrolled','active','completed')
  order by pr.full_name
  limit 500;
end;
$$;
revoke all on function public.nabd_os_course_roster(uuid) from public, anon;
grant execute on function public.nabd_os_course_roster(uuid) to authenticated;
comment on function public.nabd_os_course_roster(uuid) is 'Minimal roster for authorised administrator or active assigned faculty; no email, phone, or sensitive profile fields.';