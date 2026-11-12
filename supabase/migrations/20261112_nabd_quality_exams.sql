-- NABD Academy · Director-only examinations and quality control, Nov 2026
-- One director authorizes publication; student visibility is strictly time-limited server-side.
begin;

create table public.nabd_quality_exams (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 3 and 220),
 course_id uuid references public.courses(id) on delete set null,
 source_filename text not null default '' check (char_length(source_filename)<=240),
 source_path text check (source_path is null or char_length(source_path)<=400),
 questions jsonb not null default '[]'::jsonb
   check (jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 0 and 40),
 duration_minutes integer not null default 60 check(duration_minutes between 5 and 180),
 status text not null default 'draft' check(status in ('draft','published','closed')),
 opens_at timestamptz,
 closes_at timestamptz,
 approved_by uuid references auth.users(id),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint quality_publish_dates check (
   status='draft' or
   (opens_at is not null and closes_at is not null and closes_at>opens_at and approved_by is not null))
);
create index nabd_quality_exams_timeline on public.nabd_quality_exams(status,closes_at desc);
alter table public.nabd_quality_exams enable row level security;
revoke all on public.nabd_quality_exams from public,anon,authenticated;
grant select,insert,update,delete on public.nabd_quality_exams to authenticated;
create policy "Only the recorded academy director may access examination drafts and keys"
 on public.nabd_quality_exams for all to authenticated
 using (exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())))
 with check (created_by=(select auth.uid()) and exists(
    select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));

create table public.nabd_quality_submissions (
 id uuid primary key default gen_random_uuid(),
 exam_id uuid not null references public.nabd_quality_exams(id) on delete restrict,
 student_id uuid not null references auth.users(id) on delete restrict default auth.uid(),
 answers jsonb not null check (jsonb_typeof(answers)='object' and octet_length(answers::text)<=65000),
 submitted_at timestamptz not null default now(),
 human_score numeric(5,2) check (human_score is null or human_score between 0 and 100),
 grade_notes text check (grade_notes is null or char_length(grade_notes)<=6000),
 graded_by uuid references auth.users(id),
 graded_at timestamptz,
 unique(exam_id,student_id)
);
create index nabd_quality_submissions_exam on public.nabd_quality_submissions(exam_id,submitted_at desc);
alter table public.nabd_quality_submissions enable row level security;
revoke all on public.nabd_quality_submissions from public,anon,authenticated;
grant select on public.nabd_quality_submissions to authenticated;
grant insert (exam_id,student_id,answers) on public.nabd_quality_submissions to authenticated;
grant update (human_score,grade_notes,graded_by,graded_at) on public.nabd_quality_submissions to authenticated;
create policy "Students can see only their own submissions and director can review"
 on public.nabd_quality_submissions for select to authenticated
 using(student_id=(select auth.uid()) or exists(
  select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create policy "Only students may submit while director-published exam is active"
 on public.nabd_quality_submissions for insert to authenticated
 with check(student_id=(select auth.uid())
  and human_score is null and graded_by is null and graded_at is null and grade_notes is null
  and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student')
  and exists(select 1 from public.nabd_quality_exams x where x.id=exam_id
     and x.status='published' and x.opens_at<=now() and x.closes_at>now()));
create policy "Only exam director may grade student submissions"
 on public.nabd_quality_submissions for update to authenticated
 using(exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())))
 with check(exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));

create or replace function public.nabd_quality_guard_exam()
returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and OLD.status in ('published','closed') then
   if NEW.questions is distinct from OLD.questions
     or NEW.title is distinct from OLD.title
     or NEW.duration_minutes is distinct from OLD.duration_minutes
     or NEW.source_path is distinct from OLD.source_path
     or NEW.course_id is distinct from OLD.course_id
     or NEW.created_by is distinct from OLD.created_by
     or NEW.opens_at is distinct from OLD.opens_at
     or NEW.closes_at is distinct from OLD.closes_at
     or NEW.approved_by is distinct from OLD.approved_by
   then raise exception 'PUBLISHED_EXAM_IMMUTABLE'; end if;
   if OLD.status='closed' and NEW.status<>'closed'
   then raise exception 'CLOSED_EXAM_IMMUTABLE'; end if;
 end if;
 if TG_OP='UPDATE' and OLD.status='draft' and NEW.status='published'
 then raise exception 'USE_DIRECTOR_PUBLISH_FUNCTION'; end if;
 if TG_OP='INSERT' and NEW.status<>'draft'
 then raise exception 'EXAM_MUST_START_AS_DRAFT'; end if;
 return NEW;
end $$;
create trigger nabd_quality_immutable_exam
 before insert or update on public.nabd_quality_exams
 for each row execute function public.nabd_quality_guard_exam();

create or replace function public.nabd_quality_publish_exam(p_exam uuid)
returns table (opens_at timestamptz,closes_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_uid uuid := (select auth.uid());
begin
 if v_uid is null or not exists(select 1 from public.nabd_exam_owner where user_id=v_uid)
 then raise exception 'DIRECTOR_ONLY'; end if;
 -- Function-specific scope: allow transition from draft to published via bypassing only
 -- the generic guard through a transaction-local flag.
 perform set_config('nabd.quality_approved_publish','yes',true);
 return query update public.nabd_quality_exams x
   set status='published',opens_at=now(),closes_at=now()+make_interval(mins=>x.duration_minutes),
       approved_by=v_uid, updated_at=now()
   where x.id=p_exam and x.status='draft'
     and jsonb_array_length(x.questions)>0 and x.created_by=v_uid
   returning x.opens_at,x.closes_at;
 if not found then raise exception 'EXAM_NOT_READY_OR_NOT_FOUND'; end if;
end $$;
-- Allow only RPC above to transition into published.
create or replace function public.nabd_quality_guard_exam()
returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and OLD.status in ('published','closed') then
   if NEW.questions is distinct from OLD.questions
     or NEW.title is distinct from OLD.title
     or NEW.duration_minutes is distinct from OLD.duration_minutes
     or NEW.source_path is distinct from OLD.source_path
     or NEW.course_id is distinct from OLD.course_id
     or NEW.created_by is distinct from OLD.created_by
     or NEW.opens_at is distinct from OLD.opens_at
     or NEW.closes_at is distinct from OLD.closes_at
     or NEW.approved_by is distinct from OLD.approved_by
   then raise exception 'PUBLISHED_EXAM_IMMUTABLE'; end if;
   if OLD.status='closed' and NEW.status<>'closed'
   then raise exception 'CLOSED_EXAM_IMMUTABLE'; end if;
 end if;
 if TG_OP='UPDATE' and OLD.status='draft' and NEW.status='published'
   and coalesce(current_setting('nabd.quality_approved_publish',true),'')<>'yes'
 then raise exception 'USE_DIRECTOR_PUBLISH_FUNCTION'; end if;
 if TG_OP='INSERT' and NEW.status<>'draft'
 then raise exception 'EXAM_MUST_START_AS_DRAFT'; end if;
 return NEW;
end $$;
revoke all on function public.nabd_quality_publish_exam(uuid) from public,anon;
grant execute on function public.nabd_quality_publish_exam(uuid) to authenticated;

create or replace function public.nabd_quality_active_exams()
returns table (id uuid,title text,opens_at timestamptz,closes_at timestamptz,
 duration_minutes integer,question_count integer,course_title text)
language sql stable security definer set search_path='' as $$
 select x.id,x.title,x.opens_at,x.closes_at,x.duration_minutes,
 jsonb_array_length(x.questions)::integer,
 coalesce(c.title_ar,c.title_en,'جميع المسارات')::text
 from public.nabd_quality_exams x
 left join public.courses c on x.course_id=c.id
 where (select auth.uid()) is not null
  and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student')
  and x.status='published' and x.opens_at<=now() and x.closes_at>now()
 order by x.opens_at desc;
$$;
revoke all on function public.nabd_quality_active_exams() from public,anon;
grant execute on function public.nabd_quality_active_exams() to authenticated;

create or replace function public.nabd_quality_student_questions(p_exam uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare output jsonb;
begin
 if (select auth.uid()) is null or not exists(
   select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='student')
 then raise exception 'STUDENT_ONLY'; end if;
 select jsonb_build_object('id',x.id,'title',x.title,'closes_at',x.closes_at,
  'duration_minutes',x.duration_minutes,
  'questions',coalesce((select jsonb_agg(
    q.item - 'answer_key' - 'rubric' - 'source_excerpt' - 'correct_index'
    order by q.ordinality)
   from jsonb_array_elements(x.questions) with ordinality as q(item,ordinality)),'[]'::jsonb))
 into output from public.nabd_quality_exams x
 where x.id=p_exam and x.status='published' and x.opens_at<=now() and x.closes_at>now();
 return output;
end $$;
revoke all on function public.nabd_quality_student_questions(uuid) from public,anon;
grant execute on function public.nabd_quality_student_questions(uuid) to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('nabd-quality-lecture-pdfs','nabd-quality-lecture-pdfs',false,15728640,array['application/pdf'])
on conflict (id) do nothing;
create policy "Only exam director may upload quality lecture PDFs"
 on storage.objects for insert to authenticated
 with check(bucket_id='nabd-quality-lecture-pdfs'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create policy "Only exam director may read quality lecture PDFs"
 on storage.objects for select to authenticated
 using(bucket_id='nabd-quality-lecture-pdfs'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create policy "Only exam director may remove quality lecture PDFs"
 on storage.objects for delete to authenticated
 using(bucket_id='nabd-quality-lecture-pdfs'
  and split_part(name,'/',1)=(select auth.uid())::text
  and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
commit;
