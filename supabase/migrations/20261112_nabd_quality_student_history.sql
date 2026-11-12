-- Students can inspect only their own past submissions and human grading after exams expire.
begin;
create or replace function public.nabd_quality_student_history()
returns table(exam_id uuid,title text,submitted_at timestamptz,
 human_score numeric,grade_notes text,graded_at timestamptz)
language sql stable security definer set search_path='' as $$
 select s.exam_id,x.title,s.submitted_at,s.human_score,s.grade_notes,s.graded_at
 from public.nabd_quality_submissions s
 join public.nabd_quality_exams x on x.id=s.exam_id
 where (select auth.uid()) is not null
   and s.student_id=(select auth.uid())
   and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student')
 order by s.submitted_at desc limit 100;
$$;
revoke all on function public.nabd_quality_student_history() from public,anon;
grant execute on function public.nabd_quality_student_history() to authenticated;
commit;