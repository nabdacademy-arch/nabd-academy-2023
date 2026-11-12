-- Evaluate exam's time gate with an owner-independent, explicit student identity check.
begin;
create or replace function public.nabd_quality_exam_is_open(p_exam uuid)
returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null
   and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student')
   and exists(select 1 from public.nabd_quality_exams x
     where x.id=p_exam and x.status='published'
       and x.opens_at<=now() and x.closes_at>now());
$$;
revoke all on function public.nabd_quality_exam_is_open(uuid) from public,anon;
grant execute on function public.nabd_quality_exam_is_open(uuid) to authenticated;
drop policy "Only students may submit while director-published exam is active" on public.nabd_quality_submissions;
create policy "Only students may submit while director-published exam is active"
 on public.nabd_quality_submissions for insert to authenticated
 with check (
   student_id=(select auth.uid())
   and human_score is null and grade_notes is null and graded_by is null and graded_at is null
   and (select public.nabd_quality_exam_is_open(exam_id))
 );
commit;