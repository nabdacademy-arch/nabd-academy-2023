-- NABD 2026-11: each exam question is worth exactly one point.
-- Convert already stored percentage scores, preserve student history, enforce at DB boundary.
begin;

with old_marks as (
  select s.id,
         jsonb_array_length(x.questions)::numeric as total,
         s.ai_score as previous_ai,
         s.human_score as previous_human
    from public.nabd_quality_submissions s
    join public.nabd_quality_exams x on x.id=s.exam_id
   where s.ai_score is not null or s.human_score is not null
)
update public.nabd_quality_submissions s
   set ai_score=case when old.previous_ai is null then null
                     else round(old.previous_ai*old.total/100,2) end,
       human_score=case when old.previous_human is null then null
                        else round(old.previous_human*old.total/100,2) end,
       ai_notes=case when old.previous_ai is null then s.ai_notes
                     else replace(s.ai_notes,
                        old.previous_ai::text||'/100',
                        round(old.previous_ai*old.total/100,2)::text||'/'||old.total::integer::text) end,
       grade_notes=case when old.previous_human is null then s.grade_notes
                        else replace(s.grade_notes,
                         old.previous_human::text||'/100',
                         round(old.previous_human*old.total/100,2)::text||'/'||old.total::integer::text) end
  from old_marks old
 where old.id=s.id;

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

drop trigger if exists nabd_quality_submission_marks_check on public.nabd_quality_submissions;
create trigger nabd_quality_submission_marks_check
 before insert or update of human_score,ai_score,exam_id on public.nabd_quality_submissions
 for each row execute function public.nabd_quality_enforce_marks();

-- New RPC keeps the old history RPC compatible for existing clients.
create or replace function public.nabd_quality_student_history_v2()
returns table (
 exam_id uuid,title text,submitted_at timestamptz,human_score numeric,
 grade_notes text,graded_at timestamptz,question_count integer
)
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
revoke all on function public.nabd_quality_student_history_v2() from public,anon;
grant execute on function public.nabd_quality_student_history_v2() to authenticated;

commit;