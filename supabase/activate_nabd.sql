-- NABD Academy: one-time additive activation for Teaching Studio and Learning Platform.
-- Intended Supabase project: zsmmmljgguycrvyrmakl (the project used by the current website).
-- Run as project owner in Supabase SQL Editor after reviewing the project/schema and backup availability.
-- No access token or provider key belongs in this file.
-- Does not alter existing profiles, courses, enrollments or certificates.
-- Both modules and integrity guards run in one transaction; any error rolls back this activation.
-- Existing conflicting objects deliberately stop the script rather than being overwritten.
-- If already activated, do not rerun: inspect the existing module definitions instead.
-- AI Edge Function deployment and its provider secret are separate steps.

begin isolation level repeatable read;
create temporary table nabd_activation_before on commit drop as select
 (select count(*) from public.profiles) as profiles,
 (select count(*) from public.courses) as courses,
 (select count(*) from public.enrollments) as enrollments,
 (select count(*) from public.certificates) as certificates;
-- Additive migration; requires existing profiles, courses and enrollments.
-- Review against live schema and take a backup before applying as database owner.

create function public.nabd_teaching_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.nabd_teaching_is_admin() from public,anon;
grant execute on function public.nabd_teaching_is_admin() to authenticated;
create table public.nabd_teaching_assignments (
 lecturer_id uuid not null references auth.users(id) on delete cascade, course_id text not null,
 display_name text not null check(char_length(btrim(display_name)) between 1 and 160),
 active boolean not null default true, created_at timestamptz not null default now(), primary key(lecturer_id,course_id)
);
create table public.nabd_teaching_records (
 id uuid primary key default gen_random_uuid(), lecturer_id uuid not null references auth.users(id) on delete cascade,
 course_id text not null, kind text not null check(kind in ('session','resource')),
 title text not null check(char_length(btrim(title)) between 1 and 200),
 objective text not null check(char_length(btrim(objective)) between 1 and 2000),
 description text not null default '' check(char_length(description)<=6000),
 reference text not null default '' check(char_length(reference)<=2000),
 resource_url text not null default '' check(resource_url='' or (resource_url ~ '^https?://' and char_length(resource_url)<=2000)),
 starts_at timestamptz, status text not null default 'draft' check(status in ('draft','published')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Accept existing UUID/numeric course IDs without changing the courses schema.
create function public.nabd_teaching_validate_course() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.courses where id::text=new.course_id) then raise exception 'Unknown course' using errcode='23503'; end if;
 if TG_TABLE_NAME='nabd_teaching_records' then
  if TG_OP='UPDATE' then
   if new.lecturer_id<>old.lecturer_id or new.created_at<>old.created_at or new.id<>old.id then raise exception 'Record identity cannot change'; end if;
  end if;
  new.updated_at=now();
 end if;
 return new;
end;$$;
revoke all on function public.nabd_teaching_validate_course() from public,anon,authenticated;
create trigger teaching_assignment_course before insert or update on public.nabd_teaching_assignments for each row execute function public.nabd_teaching_validate_course();
create trigger teaching_record_course before insert or update on public.nabd_teaching_records for each row execute function public.nabd_teaching_validate_course();
create index teaching_page on public.nabd_teaching_records(created_at desc,id);
create index teaching_course on public.nabd_teaching_records(course_id,status);
alter table public.nabd_teaching_assignments enable row level security;
alter table public.nabd_teaching_records enable row level security;
revoke all on public.nabd_teaching_assignments,public.nabd_teaching_records from public,anon,authenticated;
grant select,insert,update on public.nabd_teaching_assignments,public.nabd_teaching_records to authenticated;
create policy assignments_read on public.nabd_teaching_assignments for select to authenticated using (lecturer_id=(select auth.uid()) or (select public.nabd_teaching_is_admin()));
create policy assignments_create on public.nabd_teaching_assignments for insert to authenticated with check ((select public.nabd_teaching_is_admin()));
create policy assignments_update on public.nabd_teaching_assignments for update to authenticated using ((select public.nabd_teaching_is_admin())) with check ((select public.nabd_teaching_is_admin()));
create policy teaching_read on public.nabd_teaching_records for select to authenticated using (
 (select public.nabd_teaching_is_admin())
 or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
 or (status='published' and exists(select 1 from public.enrollments e where e.student_id=(select auth.uid()) and e.course_id::text=nabd_teaching_records.course_id))
);
create policy teaching_create on public.nabd_teaching_records for insert to authenticated with check (
 lecturer_id=(select auth.uid()) and ((select public.nabd_teaching_is_admin()) or exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
);
create policy teaching_update on public.nabd_teaching_records for update to authenticated using (
 (select public.nabd_teaching_is_admin()) or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
) with check (
 (select public.nabd_teaching_is_admin()) or (lecturer_id=(select auth.uid()) and exists(select 1 from public.nabd_teaching_assignments a where a.lecturer_id=(select auth.uid()) and a.course_id=nabd_teaching_records.course_id and a.active))
);

-- Additive learning platform; no updates to existing students, courses or certificates.
-- Prerequisites: profiles(id,role), courses(id), enrollments(student_id,course_id).
-- Review the live schema and take a backup before applying as database owner.

create schema if not exists nabd_learning_private;
revoke all on schema nabd_learning_private from public,anon,authenticated;
create function public.nabd_learning_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
create function public.nabd_learning_has_course(p_course text) returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and ((select public.nabd_learning_is_admin()) or exists(select 1 from public.enrollments where student_id=(select auth.uid()) and course_id::text=p_course));
$$;
create table public.nabd_lms_lessons (
 id uuid primary key default gen_random_uuid(), course_id text not null,
 title text not null check(char_length(btrim(title)) between 1 and 200),
 objective text not null default '' check(char_length(objective)<=2000),
 body text not null check(char_length(btrim(body)) between 1 and 20000),
 resource_url text not null default '' check(resource_url='' or (resource_url ~ '^https://' and char_length(resource_url)<=2000)),
 kind text not null default 'lesson' check(kind in ('lesson','assignment')),
 published boolean not null default false, position integer not null default 0 check(position>=0),
 created_at timestamptz not null default now()
);
create function public.nabd_lms_validate_course() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.courses where id::text=new.course_id) then raise exception 'Unknown course' using errcode='23503'; end if;
 return new;
end;$$;
create trigger lms_validate_course before insert or update on public.nabd_lms_lessons for each row execute function public.nabd_lms_validate_course();
create function public.nabd_lms_can_read_lesson(p_lesson uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.nabd_lms_lessons where id=p_lesson and ((select public.nabd_learning_is_admin()) or (published and public.nabd_learning_has_course(course_id))));
$$;
create table public.nabd_lms_questions (
 id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.nabd_lms_lessons(id) on delete cascade,
 prompt text not null check(char_length(btrim(prompt)) between 1 and 1500),
 choices jsonb not null check(jsonb_typeof(choices)='array' and jsonb_array_length(choices) between 2 and 6),
 position integer not null default 0 check(position>=0)
);
create table nabd_learning_private.answer_keys (
 question_id uuid primary key references public.nabd_lms_questions(id) on delete cascade,
 correct_index integer not null check(correct_index between 0 and 5),
 explanation text not null check(char_length(btrim(explanation)) between 1 and 2000)
);
create table public.nabd_lms_progress (
 student_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.nabd_lms_lessons(id) on delete cascade,
 completed_at timestamptz not null default now(),primary key(student_id,lesson_id)
);
create table public.nabd_lms_attempts (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.nabd_lms_lessons(id) on delete cascade,
 score integer not null check(score>=0),total integer not null check(total>0 and score<=total),
 created_at timestamptz not null default now()
);
create table public.nabd_lms_submissions (
 id uuid primary key default gen_random_uuid(),student_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.nabd_lms_lessons(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 6000),
 feedback text not null default '' check(char_length(feedback)<=3000),
 grade integer check(grade between 0 and 100), reviewed_at timestamptz,
 submitted_at timestamptz not null default now(),unique(student_id,lesson_id)
);
create table public.nabd_learning_rounds (
 id uuid primary key default gen_random_uuid(),title text not null check(char_length(btrim(title)) between 1 and 200),
 speaker text not null default '' check(char_length(speaker)<=200),
 description text not null default '' check(char_length(description)<=4000),
 starts_at timestamptz not null,meeting_url text not null default '' check(meeting_url='' or (meeting_url ~ '^https://' and char_length(meeting_url)<=2000)),
 published boolean not null default false,created_at timestamptz not null default now()
);
create table public.nabd_learning_posts (
 id uuid primary key default gen_random_uuid(),author_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check(char_length(btrim(display_name)) between 1 and 60),
 topic text not null check(topic in ('learning','research','resources')),
 body text not null check(char_length(btrim(body)) between 1 and 1500),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table nabd_learning_private.tutor_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,minute timestamptz not null,hits integer not null check(hits between 1 and 6)
);
create index lms_lessons_course on public.nabd_lms_lessons(course_id,position,id);
create index lms_questions_lesson on public.nabd_lms_questions(lesson_id,position,id);
create index lms_attempts_student on public.nabd_lms_attempts(student_id,created_at desc);
create index learning_posts_status on public.nabd_learning_posts(status,created_at desc);
create index learning_rounds_date on public.nabd_learning_rounds(published,starts_at);

alter table public.nabd_lms_lessons enable row level security;
alter table public.nabd_lms_questions enable row level security;
alter table public.nabd_lms_progress enable row level security;
alter table public.nabd_lms_attempts enable row level security;
alter table public.nabd_lms_submissions enable row level security;
alter table public.nabd_learning_rounds enable row level security;
alter table public.nabd_learning_posts enable row level security;
revoke all on all tables in schema nabd_learning_private from public,anon,authenticated;
revoke all on public.nabd_lms_lessons,public.nabd_lms_questions,public.nabd_lms_progress,public.nabd_lms_attempts,public.nabd_lms_submissions,public.nabd_learning_rounds,public.nabd_learning_posts from public,anon,authenticated;
grant select on public.nabd_lms_lessons,public.nabd_lms_questions,public.nabd_lms_progress,public.nabd_lms_attempts,public.nabd_lms_submissions,public.nabd_learning_posts to authenticated;
grant insert,update,delete on public.nabd_lms_lessons to authenticated;
grant select on public.nabd_learning_rounds to anon,authenticated;
grant insert,update,delete on public.nabd_learning_rounds to authenticated;
grant insert(author_id,display_name,topic,body,status) on public.nabd_learning_posts to authenticated;
grant update(status) on public.nabd_learning_posts to authenticated;
create policy lms_lessons_read on public.nabd_lms_lessons for select to authenticated using (public.nabd_lms_can_read_lesson(id));
create policy lms_lessons_admin on public.nabd_lms_lessons for all to authenticated using ((select public.nabd_learning_is_admin())) with check((select public.nabd_learning_is_admin()));
create policy lms_questions_read on public.nabd_lms_questions for select to authenticated using (public.nabd_lms_can_read_lesson(lesson_id));
create policy lms_progress_read on public.nabd_lms_progress for select to authenticated using(student_id=(select auth.uid()) or (select public.nabd_learning_is_admin()));
create policy lms_attempts_read on public.nabd_lms_attempts for select to authenticated using(student_id=(select auth.uid()) or (select public.nabd_learning_is_admin()));
create policy lms_submissions_read on public.nabd_lms_submissions for select to authenticated using(student_id=(select auth.uid()) or (select public.nabd_learning_is_admin()));
create policy learning_rounds_read on public.nabd_learning_rounds for select using(published);
create policy learning_rounds_admin on public.nabd_learning_rounds for all to authenticated using((select public.nabd_learning_is_admin())) with check((select public.nabd_learning_is_admin()));
create policy learning_posts_read on public.nabd_learning_posts for select to authenticated using(status='approved' or author_id=(select auth.uid()) or (select public.nabd_learning_is_admin()));
create policy learning_posts_submit on public.nabd_learning_posts for insert to authenticated with check(author_id=(select auth.uid()) and status='pending');
create policy learning_posts_review on public.nabd_learning_posts for update to authenticated using((select public.nabd_learning_is_admin())) with check((select public.nabd_learning_is_admin()));

create function public.nabd_lms_save_question(p_lesson uuid,p_prompt text,p_choices jsonb,p_correct integer,p_explanation text,p_position integer default 0,p_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.nabd_learning_is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if jsonb_typeof(p_choices)<>'array' or jsonb_array_length(p_choices) not between 2 and 6 or p_correct is null or p_correct<0 or p_correct>=jsonb_array_length(p_choices) then raise exception 'Invalid choices'; end if;
 if exists(select 1 from jsonb_array_elements(p_choices) x where jsonb_typeof(x)<>'string' or char_length(btrim(x#>>'{}')) not between 1 and 600) then raise exception 'Invalid choice text'; end if;
 if p_id is null then
  insert into public.nabd_lms_questions(lesson_id,prompt,choices,position) values(p_lesson,p_prompt,p_choices,p_position) returning id into v_id;
 else
  update public.nabd_lms_questions set lesson_id=p_lesson,prompt=p_prompt,choices=p_choices,position=p_position where id=p_id returning id into v_id;
  if v_id is null then raise exception 'Question not found'; end if;
 end if;
 insert into nabd_learning_private.answer_keys(question_id,correct_index,explanation) values(v_id,p_correct,p_explanation)
 on conflict(question_id) do update set correct_index=excluded.correct_index,explanation=excluded.explanation;
 return v_id;
end;$$;
create function public.nabd_lms_grade_quiz(p_lesson uuid,p_answers jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare q record;v_total integer:=0;v_score integer:=0;v_choice integer;v_feedback jsonb:='[]'::jsonb;v_id uuid;
begin
 if (select auth.uid()) is null or not public.nabd_lms_can_read_lesson(p_lesson) then raise exception 'Enrollment required' using errcode='42501'; end if;
 if jsonb_typeof(p_answers)<>'object' then raise exception 'Answers must be an object'; end if;
 if (select count(*) from public.nabd_lms_attempts where student_id=(select auth.uid()) and lesson_id=p_lesson and created_at>now()-interval '1 minute')>=6 then raise exception 'Try again later'; end if;
 for q in select x.id,x.choices,k.correct_index,k.explanation from public.nabd_lms_questions x join nabd_learning_private.answer_keys k on k.question_id=x.id where x.lesson_id=p_lesson order by x.position,x.id loop
  if not(p_answers ? q.id::text) or jsonb_typeof(p_answers->q.id::text)<>'number' or (p_answers->>q.id::text) !~ '^[0-5]$' then raise exception 'Complete all answers'; end if;
  v_choice:=(p_answers->>q.id::text)::integer;
  if v_choice>=jsonb_array_length(q.choices) then raise exception 'Choice out of range'; end if;
  v_total:=v_total+1;if v_choice=q.correct_index then v_score:=v_score+1;end if;
  v_feedback:=v_feedback||jsonb_build_array(jsonb_build_object('question_id',q.id,'correct',v_choice=q.correct_index,'explanation',q.explanation));
 end loop;
 if v_total=0 or (select count(*) from jsonb_object_keys(p_answers))<>v_total then raise exception 'Invalid quiz answers'; end if;
 insert into public.nabd_lms_attempts(student_id,lesson_id,score,total) values((select auth.uid()),p_lesson,v_score,v_total) returning id into v_id;
 return jsonb_build_object('id',v_id,'score',v_score,'total',v_total,'feedback',v_feedback);
end;$$;
create function public.nabd_lms_complete_lesson(p_lesson uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not public.nabd_lms_can_read_lesson(p_lesson) then raise exception 'Enrollment required' using errcode='42501';end if;
 insert into public.nabd_lms_progress(student_id,lesson_id) values((select auth.uid()),p_lesson) on conflict do nothing;
end;$$;
create function public.nabd_lms_submit_assignment(p_lesson uuid,p_body text) returns void language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not public.nabd_lms_can_read_lesson(p_lesson) then raise exception 'Enrollment required' using errcode='42501';end if;
 if not exists(select 1 from public.nabd_lms_lessons where id=p_lesson and kind='assignment') then raise exception 'Not an assignment';end if;
 insert into public.nabd_lms_submissions(student_id,lesson_id,body) values((select auth.uid()),p_lesson,p_body)
 on conflict(student_id,lesson_id) do update set body=excluded.body,feedback='',grade=null,reviewed_at=null,submitted_at=now();
end;$$;
create function public.nabd_lms_review_submission(p_id uuid,p_feedback text,p_grade integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.nabd_learning_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 update public.nabd_lms_submissions set feedback=p_feedback,grade=p_grade,reviewed_at=now() where id=p_id;
 if not found then raise exception 'Submission not found';end if;
end;$$;
create function public.nabd_learning_take_tutor_slot() returns boolean language plpgsql security definer set search_path='' as $$
declare v_hits integer;
begin
 if (select auth.uid()) is null then return false;end if;
 insert into nabd_learning_private.tutor_usage(user_id,minute,hits) values((select auth.uid()),date_trunc('minute',now()),1)
 on conflict(user_id) do update set minute=excluded.minute,hits=case when tutor_usage.minute=excluded.minute then tutor_usage.hits+1 else 1 end
 where tutor_usage.minute<>excluded.minute or tutor_usage.hits<6 returning hits into v_hits;
 return v_hits is not null;
end;$$;
revoke all on function public.nabd_learning_is_admin(),public.nabd_learning_has_course(text),public.nabd_lms_can_read_lesson(uuid),public.nabd_lms_validate_course(),public.nabd_lms_save_question(uuid,text,jsonb,integer,text,integer,uuid),public.nabd_lms_grade_quiz(uuid,jsonb),public.nabd_lms_complete_lesson(uuid),public.nabd_lms_submit_assignment(uuid,text),public.nabd_lms_review_submission(uuid,text,integer),public.nabd_learning_take_tutor_slot() from public,anon,authenticated;
grant execute on function public.nabd_learning_is_admin(),public.nabd_learning_has_course(text),public.nabd_lms_can_read_lesson(uuid),public.nabd_lms_save_question(uuid,text,jsonb,integer,text,integer,uuid),public.nabd_lms_grade_quiz(uuid,jsonb),public.nabd_lms_complete_lesson(uuid),public.nabd_lms_submit_assignment(uuid,text),public.nabd_lms_review_submission(uuid,text,integer),public.nabd_learning_take_tutor_slot() to authenticated;
create table nabd_learning_private.activation_versions(version text primary key,checksum text not null,activated_at timestamptz not null default now());
insert into nabd_learning_private.activation_versions(version,checksum) values('20261105-connected','6ad1cf3fd3232be9a76e9ddb7248e48605d7e484e66e2ff91627d0e48a3bc2f7');

do $$ begin
 if exists(select 1 from nabd_activation_before b where
 b.profiles<>(select count(*) from public.profiles) or
 b.courses<>(select count(*) from public.courses) or
 b.enrollments<>(select count(*) from public.enrollments) or
 b.certificates<>(select count(*) from public.certificates)) then
 raise exception 'Core record counts changed; rolling back activation';
 end if;
end;$$;
commit;
