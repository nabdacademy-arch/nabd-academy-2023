-- NABD Academy: marks are awarded per question, never normalized to 100.
-- Applied to production as Supabase migration nabd_exam_marks_per_question
-- on 2026-11-13. This checked-in replay is idempotent; historical grade
-- conversions are NOT repeated here (reconverting already-raw scores would
-- corrupt prior marks).
--
-- Scoring contract:
--   One exam question = 1 available mark, partial credit 0..1.
--   The displayed total is jsonb_array_length(exams.questions).
--   Both preliminary AI marks and director-approved human marks are raw marks.
create or replace function public.nabd_quality_enforce_marks()
returns trigger language plpgsql set search_path='' as $$
declare v_total integer;
begin
  select jsonb_array_length(x.questions) into v_total
    from public.nabd_quality_exams x where x.id=new.exam_id;
  if v_total is null or v_total<1 then
    raise exception 'INVALID_EXAM_TOTAL';
  end if;
  if (new.human_score is not null and (new.human_score<0 or new.human_score>v_total))
     or (new.ai_score is not null and (new.ai_score<0 or new.ai_score>v_total)) then
    raise exception 'SCORE_EXCEEDS_QUESTION_COUNT: maximum is %',v_total;
  end if;
  return new;
end $$;

drop trigger if exists nabd_quality_submission_marks_check
  on public.nabd_quality_submissions;
create trigger nabd_quality_submission_marks_check
before insert or update of human_score,ai_score,exam_id
on public.nabd_quality_submissions
for each row execute function public.nabd_quality_enforce_marks();

-- Student-facing history includes its own exam's maximum possible points.
create or replace function public.nabd_quality_student_history_v2()
returns table (
 exam_id uuid,title text,submitted_at timestamptz,human_score numeric,
 grade_notes text,graded_at timestamptz,question_count integer)
language sql stable security definer set search_path='' as $$
 select s.exam_id,x.title,s.submitted_at,s.human_score,s.grade_notes,s.graded_at,
        jsonb_array_length(x.questions)::integer
 from public.nabd_quality_submissions s
 join public.nabd_quality_exams x on x.id=s.exam_id
 where (select auth.uid()) is not null
   and s.student_id=(select auth.uid())
   and exists(select 1 from public.profiles p
      where p.id=(select auth.uid()) and p.role='student')
 order by s.submitted_at desc limit 100;
$$;
revoke all on function public.nabd_quality_student_history_v2()
  from public,anon;
grant execute on function public.nabd_quality_student_history_v2()
  to authenticated;
