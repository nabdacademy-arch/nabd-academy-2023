-- NABD University OS V17–V22: additive, RLS-first, no pre-existing data altered.
-- Security model: authenticated students see only their own/assigned records;
-- admin membership comes from public.profiles.role, never editable user metadata.
-- Faculty assignment is admin-issued. Exam grading runs server-side.
begin;

create table public.nabd_os_faculty_assignments (
  course_id uuid not null references public.courses(id) on delete restrict,
  lecturer_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(course_id, lecturer_id)
);
create table public.nabd_os_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  title_ar text not null check(char_length(btrim(title_ar)) between 3 and 200),
  title_en text not null default '' check(char_length(title_en)<=200),
  summary_ar text not null default '' check(char_length(summary_ar)<=2000),
  resource_url text not null default '' check(resource_url='' or (resource_url ~* '^https://' and char_length(resource_url)<=1200)),
  position smallint not null default 1 check(position between 1 and 120),
  status text not null default 'draft' check(status in ('draft','published')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index nabd_os_course_modules_order_idx on public.nabd_os_course_modules(course_id,position);

create table public.nabd_os_attendance (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  module_id uuid not null references public.nabd_os_course_modules(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  status text not null check(status in ('present','absent','excused','late')),
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  unique(module_id,student_id)
);
create index nabd_os_attendance_student_idx on public.nabd_os_attendance(student_id,course_id);

create table public.nabd_os_exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  title_ar text not null check(char_length(btrim(title_ar)) between 3 and 180),
  title_en text not null default '' check(char_length(title_en)<=180),
  status text not null default 'draft' check(status in ('draft','published','closed')),
  passing_percent smallint not null default 60 check(passing_percent between 0 and 100),
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check(closes_at is null or opens_at is null or closes_at>opens_at)
);
create index nabd_os_exams_course_idx on public.nabd_os_exams(course_id,status);

create table public.nabd_os_exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.nabd_os_exams(id) on delete restrict,
  prompt_ar text not null check(char_length(btrim(prompt_ar)) between 5 and 2000),
  prompt_en text not null default '' check(char_length(prompt_en)<=2000),
  options_ar jsonb not null check(jsonb_typeof(options_ar)='array' and jsonb_array_length(options_ar) between 2 and 6),
  options_en jsonb not null check(jsonb_typeof(options_en)='array' and jsonb_array_length(options_en) between 2 and 6),
  position smallint not null default 1 check(position between 1 and 100),
  points smallint not null default 1 check(points between 1 and 10),
  created_at timestamptz not null default now(),
  check(jsonb_array_length(options_ar)=jsonb_array_length(options_en))
);
create index nabd_os_questions_exam_idx on public.nabd_os_exam_questions(exam_id,position);
-- Never include the answer key on a row visible to students.
create table public.nabd_os_exam_keys (
  question_id uuid primary key references public.nabd_os_exam_questions(id) on delete cascade,
  correct_index smallint not null check(correct_index between 0 and 5),
  explanation_ar text not null default '' check(char_length(explanation_ar)<=2000),
  explanation_en text not null default '' check(char_length(explanation_en)<=2000)
);
create table public.nabd_os_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.nabd_os_exams(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  answers jsonb not null check(jsonb_typeof(answers)='object'),
  score integer not null check(score>=0),
  max_score integer not null check(max_score>0 and score<=max_score),
  passed boolean not null,
  submitted_at timestamptz not null default now(),
  unique(exam_id,student_id)
);
create index nabd_os_attempts_student_idx on public.nabd_os_exam_attempts(student_id,submitted_at desc);

create table public.nabd_os_certificate_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check(status in ('pending','under_review','eligible','declined')),
  reviewer_id uuid references public.profiles(id),
  reviewer_note text not null default '' check(char_length(reviewer_note)<=1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(course_id,student_id)
);
create index nabd_os_cert_requests_status_idx on public.nabd_os_certificate_requests(status,created_at desc);

create table public.nabd_os_research_proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check(char_length(btrim(title)) between 8 and 200),
  question text not null check(char_length(btrim(question)) between 10 and 1000),
  methodology text not null default '' check(char_length(methodology)<=2000),
  status text not null default 'draft' check(status in ('draft','submitted','in_review','accepted','declined')),
  reviewer_id uuid references public.profiles(id),
  reviewer_note text not null default '' check(char_length(reviewer_note)<=1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index nabd_os_research_author_idx on public.nabd_os_research_proposals(author_id,created_at desc);

create table public.nabd_os_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  event_type text not null check(char_length(event_type) between 3 and 90),
  object_type text not null check(char_length(object_type) between 3 and 60),
  object_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index nabd_os_audit_created_idx on public.nabd_os_audit_events(created_at desc);

-- Tables in the exposed public schema are deny-by-default.
alter table public.nabd_os_faculty_assignments enable row level security;
alter table public.nabd_os_course_modules enable row level security;
alter table public.nabd_os_attendance enable row level security;
alter table public.nabd_os_exams enable row level security;
alter table public.nabd_os_exam_questions enable row level security;
alter table public.nabd_os_exam_keys enable row level security;
alter table public.nabd_os_exam_attempts enable row level security;
alter table public.nabd_os_certificate_requests enable row level security;
alter table public.nabd_os_research_proposals enable row level security;
alter table public.nabd_os_audit_events enable row level security;
revoke all on public.nabd_os_faculty_assignments, public.nabd_os_course_modules, public.nabd_os_attendance,
  public.nabd_os_exams, public.nabd_os_exam_questions, public.nabd_os_exam_keys,
  public.nabd_os_exam_attempts, public.nabd_os_certificate_requests, public.nabd_os_research_proposals,
  public.nabd_os_audit_events from public,anon,authenticated;
grant select,insert,update on public.nabd_os_faculty_assignments, public.nabd_os_course_modules,
  public.nabd_os_attendance, public.nabd_os_exams, public.nabd_os_exam_questions,
  public.nabd_os_exam_keys, public.nabd_os_certificate_requests, public.nabd_os_research_proposals to authenticated;
grant select on public.nabd_os_exam_attempts,public.nabd_os_audit_events to authenticated;

create policy os_faculty_read on public.nabd_os_faculty_assignments for select to authenticated
  using (lecturer_id=(select auth.uid()) or (select public.is_admin()));
create policy os_faculty_admin_insert on public.nabd_os_faculty_assignments for insert to authenticated
  with check ((select public.is_admin()) and assigned_by=(select auth.uid()));
create policy os_faculty_admin_update on public.nabd_os_faculty_assignments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy os_module_read on public.nabd_os_course_modules for select to authenticated
  using ((select public.is_admin())
    or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_course_modules.course_id and f.lecturer_id=(select auth.uid()) and f.active)
    or (status='published' and exists(select 1 from public.enrollments e where e.course_id=nabd_os_course_modules.course_id and e.student_id=(select auth.uid()) and e.status in ('enrolled','active','completed'))));
create policy os_module_insert on public.nabd_os_course_modules for insert to authenticated
  with check (created_by=(select auth.uid()) and ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_course_modules.course_id and f.lecturer_id=(select auth.uid()) and f.active)));
create policy os_module_update on public.nabd_os_course_modules for update to authenticated
  using ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_course_modules.course_id and f.lecturer_id=(select auth.uid()) and f.active))
  with check ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_course_modules.course_id and f.lecturer_id=(select auth.uid()) and f.active));

create policy os_attendance_read on public.nabd_os_attendance for select to authenticated
  using (student_id=(select auth.uid()) or (select public.is_admin())
    or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_attendance.course_id and f.lecturer_id=(select auth.uid()) and f.active));
create policy os_attendance_insert on public.nabd_os_attendance for insert to authenticated
  with check (recorded_by=(select auth.uid())
    and exists(select 1 from public.enrollments e where e.student_id=nabd_os_attendance.student_id and e.course_id=nabd_os_attendance.course_id)
    and exists(select 1 from public.nabd_os_course_modules m where m.id=nabd_os_attendance.module_id and m.course_id=nabd_os_attendance.course_id)
    and ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_attendance.course_id and f.lecturer_id=(select auth.uid()) and f.active)));
create policy os_attendance_update on public.nabd_os_attendance for update to authenticated
  using ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_attendance.course_id and f.lecturer_id=(select auth.uid()) and f.active))
  with check (recorded_by=(select auth.uid()) and
    ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_attendance.course_id and f.lecturer_id=(select auth.uid()) and f.active)));

create policy os_exam_read on public.nabd_os_exams for select to authenticated
  using ((select public.is_admin()) or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=nabd_os_exams.course_id and f.lecturer_id=(select auth.uid()) and f.active)
    or (status='published' and exists(select 1 from public.enrollments e where e.course_id=nabd_os_exams.course_id and e.student_id=(select auth.uid()) and e.status in ('enrolled','active','completed'))));
create policy os_exam_admin_insert on public.nabd_os_exams for insert to authenticated
  with check ((select public.is_admin()) and created_by=(select auth.uid()));
create policy os_exam_admin_update on public.nabd_os_exams for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy os_question_read on public.nabd_os_exam_questions for select to authenticated
  using (exists(select 1 from public.nabd_os_exams x where x.id=nabd_os_exam_questions.exam_id
    and ((select public.is_admin())
    or exists(select 1 from public.nabd_os_faculty_assignments f where f.course_id=x.course_id and f.lecturer_id=(select auth.uid()) and f.active)
    or (x.status='published' and exists(select 1 from public.enrollments e where e.course_id=x.course_id and e.student_id=(select auth.uid()) and e.status in ('enrolled','active','completed'))))));
create policy os_question_admin_insert on public.nabd_os_exam_questions for insert to authenticated
  with check ((select public.is_admin()) and exists(select 1 from public.nabd_os_exams x where x.id=nabd_os_exam_questions.exam_id and x.status='draft'));
create policy os_question_admin_update on public.nabd_os_exam_questions for update to authenticated
  using ((select public.is_admin()) and exists(select 1 from public.nabd_os_exams x where x.id=nabd_os_exam_questions.exam_id and x.status='draft'))
  with check ((select public.is_admin()) and exists(select 1 from public.nabd_os_exams x where x.id=nabd_os_exam_questions.exam_id and x.status='draft'));
create policy os_key_admin on public.nabd_os_exam_keys for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy os_attempt_read on public.nabd_os_exam_attempts for select to authenticated
  using (student_id=(select auth.uid()) or (select public.is_admin())
    or exists(select 1 from public.nabd_os_exams x join public.nabd_os_faculty_assignments f on f.course_id=x.course_id where x.id=nabd_os_exam_attempts.exam_id and f.lecturer_id=(select auth.uid()) and f.active));

create policy os_cert_request_read on public.nabd_os_certificate_requests for select to authenticated
  using (student_id=(select auth.uid()) or (select public.is_admin()));
create policy os_cert_request_student_insert on public.nabd_os_certificate_requests for insert to authenticated
  with check (student_id=(select auth.uid()) and status='pending' and reviewer_id is null and reviewer_note=''
    and exists(select 1 from public.enrollments e where e.student_id=(select auth.uid()) and e.course_id=nabd_os_certificate_requests.course_id));
create policy os_cert_request_admin_update on public.nabd_os_certificate_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and reviewer_id=(select auth.uid()));
create policy os_cert_request_admin_insert on public.nabd_os_certificate_requests for insert to authenticated
  with check ((select public.is_admin()));

create policy os_proposal_read on public.nabd_os_research_proposals for select to authenticated
  using (author_id=(select auth.uid()) or (select public.is_admin()));
create policy os_proposal_student_insert on public.nabd_os_research_proposals for insert to authenticated
  with check (author_id=(select auth.uid()) and status in ('draft','submitted') and reviewer_id is null and reviewer_note='');
create policy os_proposal_student_update on public.nabd_os_research_proposals for update to authenticated
  using (author_id=(select auth.uid()) and status='draft')
  with check (author_id=(select auth.uid()) and status in ('draft','submitted') and reviewer_id is null and reviewer_note='');
create policy os_proposal_admin_update on public.nabd_os_research_proposals for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy os_audit_admin_read on public.nabd_os_audit_events for select to authenticated
  using ((select public.is_admin()));

-- Server-side graded exams: no client-side grade calculation and no direct attempt INSERT privileges.
create function public.nabd_os_submit_exam(p_exam_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare
  uid uuid := (select auth.uid());
  exam public.nabd_os_exams%rowtype;
  q record;
  num_questions integer;
  num_keys integer;
  total integer;
  earned integer := 0;
  new_id uuid;
  passed_exam boolean;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or pg_column_size(p_answers)>16384 then
    raise exception 'Invalid submission';
  end if;
  select * into exam from public.nabd_os_exams where id=p_exam_id and status='published'
    and (opens_at is null or opens_at<=now()) and (closes_at is null or closes_at>=now());
  if not found then raise exception 'Exam not available'; end if;
  if not exists(select 1 from public.enrollments e where e.student_id=uid and e.course_id=exam.course_id and e.status in ('enrolled','active','completed')) then
    raise exception 'Enrollment required';
  end if;
  if exists(select 1 from public.nabd_os_exam_attempts a where a.exam_id=p_exam_id and a.student_id=uid) then
    raise exception 'Exam already submitted';
  end if;
  select count(*),coalesce(sum(points),0) into num_questions,total from public.nabd_os_exam_questions where exam_id=p_exam_id;
  select count(*) into num_keys from public.nabd_os_exam_questions q
    join public.nabd_os_exam_keys k on k.question_id=q.id where q.exam_id=p_exam_id;
  if num_questions<1 or num_questions>100 or num_questions<>num_keys or total<=0 then
    raise exception 'Exam is not configured';
  end if;
  for q in select question.id,question.points,key.correct_index from public.nabd_os_exam_questions question
    join public.nabd_os_exam_keys key on key.question_id=question.id where question.exam_id=p_exam_id
  loop
    if jsonb_typeof(p_answers->(q.id::text))='number'
      and (p_answers->>(q.id::text)) ~ '^[0-5]$'
      and (p_answers->>(q.id::text))::smallint=q.correct_index then
      earned := earned+q.points;
    end if;
  end loop;
  passed_exam := (earned*100 >= exam.passing_percent*total);
  insert into public.nabd_os_exam_attempts(exam_id,student_id,answers,score,max_score,passed)
    values(p_exam_id,uid,p_answers,earned,total,passed_exam) returning id into new_id;
  insert into public.nabd_os_audit_events(actor_id,event_type,object_type,object_id,detail)
    values(uid,'exam_submitted','exam_attempt',new_id,
      jsonb_build_object('exam_id',p_exam_id,'score',earned,'max_score',total,'passed',passed_exam));
  return jsonb_build_object('attempt_id',new_id,'score',earned,'max_score',total,'passed',passed_exam);
end;
$body$;

-- Atomic question creation and answer-key update in one transaction, admins only.
create function public.nabd_os_add_exam_question(
  p_exam_id uuid,p_prompt_ar text,p_prompt_en text,p_options_ar jsonb,p_options_en jsonb,
  p_correct_index smallint,p_points smallint default 1
) returns uuid language plpgsql security definer set search_path='' as $body$
declare uid uuid := (select auth.uid()); v_id uuid; v_position integer; begin
  if uid is null or not public.is_admin() then raise exception 'Admin required'; end if;
  if not exists(select 1 from public.nabd_os_exams where id=p_exam_id and status='draft') then raise exception 'Draft exam required'; end if;
  if p_options_ar is null or p_options_en is null or jsonb_typeof(p_options_ar)<>'array' or jsonb_typeof(p_options_en)<>'array'
    or jsonb_array_length(p_options_ar) not between 2 and 6 or jsonb_array_length(p_options_en)<>jsonb_array_length(p_options_ar)
    or p_correct_index<0 or p_correct_index>=jsonb_array_length(p_options_ar) then raise exception 'Invalid options'; end if;
  select count(*)+1 into v_position from public.nabd_os_exam_questions where exam_id=p_exam_id;
  if v_position>100 then raise exception 'Maximum 100 questions'; end if;
  insert into public.nabd_os_exam_questions(exam_id,prompt_ar,prompt_en,options_ar,options_en,position,points)
  values(p_exam_id,p_prompt_ar,p_prompt_en,p_options_ar,p_options_en,v_position,p_points)
  returning id into v_id;
  insert into public.nabd_os_exam_keys(question_id,correct_index) values(v_id,p_correct_index);
  insert into public.nabd_os_audit_events(actor_id,event_type,object_type,object_id,detail)
    values(uid,'exam_question_created','exam_question',v_id,jsonb_build_object('exam_id',p_exam_id));
  return v_id;
end;
$body$;

-- A manual administrator-only publishing function refuses incomplete exams.
create function public.nabd_os_publish_exam(p_exam_id uuid)
returns boolean language plpgsql security definer set search_path='' as $body$
declare uid uuid := (select auth.uid()); n integer; k integer; begin
  if uid is null or not public.is_admin() then raise exception 'Admin required'; end if;
  select count(*) into n from public.nabd_os_exam_questions where exam_id=p_exam_id;
  select count(*) into k from public.nabd_os_exam_questions q
    join public.nabd_os_exam_keys a on a.question_id=q.id where q.exam_id=p_exam_id;
  if n<1 or k<>n then raise exception 'Add at least one complete question first'; end if;
  update public.nabd_os_exams set status='published' where id=p_exam_id and status='draft';
  if not found then raise exception 'Draft exam required'; end if;
  insert into public.nabd_os_audit_events(actor_id,event_type,object_type,object_id)
    values(uid,'exam_published','exam',p_exam_id);
  return true;
end;
$body$;
revoke all on function public.nabd_os_submit_exam(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.nabd_os_add_exam_question(uuid,text,text,jsonb,jsonb,smallint,smallint) from public,anon,authenticated;
revoke all on function public.nabd_os_publish_exam(uuid) from public,anon,authenticated;
grant execute on function public.nabd_os_submit_exam(uuid,jsonb) to authenticated;
grant execute on function public.nabd_os_add_exam_question(uuid,text,text,jsonb,jsonb,smallint,smallint) to authenticated;
grant execute on function public.nabd_os_publish_exam(uuid) to authenticated;

-- Existing admin-only RPCs have internal checks but should not be callable anonymously.
revoke execute on function public.approve_application(uuid) from public,anon;
revoke execute on function public.issue_certificate(uuid,uuid) from public,anon;
grant execute on function public.approve_application(uuid) to authenticated;
grant execute on function public.issue_certificate(uuid,uuid) to authenticated;
commit;
