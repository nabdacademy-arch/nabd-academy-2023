
-- NABD Academy | Director-controlled AI grading bot | 2026-11
-- AI scores are preliminary. Existing human scores and remarks are never overwritten.
alter table public.nabd_quality_submissions
  add column if not exists ai_score numeric(5,2) check (ai_score is null or ai_score between 0 and 100),
  add column if not exists ai_notes text check (ai_notes is null or char_length(ai_notes)<=6000),
  add column if not exists ai_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists ai_status text not null default 'pending'
    check (ai_status in ('pending','processing','graded','needs_review')),
  add column if not exists ai_model text,
  add column if not exists ai_review_required boolean not null default false,
  add column if not exists ai_graded_at timestamptz,
  add column if not exists ai_claimed_at timestamptz,
  add column if not exists ai_run_id uuid;
create index if not exists nabd_quality_ai_queue
  on public.nabd_quality_submissions (ai_status,submitted_at) where human_score is null;

create table if not exists public.nabd_gradebot_settings (
 singleton boolean primary key default true check (singleton),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id),
 last_run timestamptz,
 last_error text,
 total_graded integer not null default 0,
 worker_token_hash text
);
insert into public.nabd_gradebot_settings (singleton,enabled)
 values (true,false) on conflict (singleton) do nothing;
alter table public.nabd_gradebot_settings enable row level security;
revoke all on public.nabd_gradebot_settings from public,anon,authenticated;
grant select (singleton,enabled,updated_at,updated_by,last_run,last_error,total_graded)
 on public.nabd_gradebot_settings to authenticated;
create policy "Only exam director may read grading bot status"
 on public.nabd_gradebot_settings for select to authenticated
 using (exists (
  select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())
 ));

create or replace function public.nabd_gradebot_status()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 if (select auth.uid()) is null or not exists
 (select 1 from public.nabd_exam_owner where user_id=(select auth.uid())) then
  raise exception 'DIRECTOR_ONLY';
 end if;
 select jsonb_build_object(
  'enabled',c.enabled,'updated_at',c.updated_at,'last_run',c.last_run,
  'last_error',c.last_error,'total_graded',c.total_graded,
  'pending',(select count(*) from public.nabd_quality_submissions s
    join public.nabd_quality_exams x on x.id=s.exam_id
    where s.human_score is null and s.ai_status='pending' and x.status<>'draft'),
  'needs_review',(select count(*) from public.nabd_quality_submissions
     where ai_status='needs_review' and human_score is null)
 ) into v from public.nabd_gradebot_settings c where c.singleton;
 return coalesce(v,'{}'::jsonb);
end $$;
revoke all on function public.nabd_gradebot_status() from public,anon;
grant execute on function public.nabd_gradebot_status() to authenticated;

create or replace function public.nabd_gradebot_toggle(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not exists
 (select 1 from public.nabd_exam_owner where user_id=(select auth.uid())) then
  raise exception 'DIRECTOR_ONLY';
 end if;
 update public.nabd_gradebot_settings
 set enabled=coalesce(p_enabled,false),updated_at=now(),updated_by=(select auth.uid()),
     last_error=null where singleton;
 return jsonb_build_object('enabled',coalesce(p_enabled,false));
end $$;
revoke all on function public.nabd_gradebot_toggle(boolean) from public,anon;
grant execute on function public.nabd_gradebot_toggle(boolean) to authenticated;

-- Worker-only RPCs: no anonymous or student/director access.
create or replace function public.nabd_gradebot_claim()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v record; v_run uuid := gen_random_uuid();
begin
 if not exists(select 1 from public.nabd_gradebot_settings where singleton and enabled) then return null; end if;
 select s.id,s.exam_id,s.answers,s.submitted_at,x.questions,x.title into v
 from public.nabd_quality_submissions s
 join public.nabd_quality_exams x on x.id=s.exam_id
 where s.human_score is null and x.status<>'draft' and
  (s.ai_status='pending' or (s.ai_status='processing' and
   s.ai_claimed_at<now()-interval '5 minutes'))
 order by s.submitted_at asc
 for update of s skip locked limit 1;
 if not found then return null; end if;
 update public.nabd_quality_submissions set ai_status='processing',
  ai_claimed_at=now(),ai_run_id=v_run where id=v.id;
 return jsonb_build_object('id',v.id,'run_id',v_run,'exam_id',v.exam_id,
  'title',v.title,'questions',v.questions,'answers',v.answers);
end $$;
revoke all on function public.nabd_gradebot_claim() from public,anon,authenticated;
grant execute on function public.nabd_gradebot_claim() to service_role;

create or replace function public.nabd_gradebot_finish(
 p_id uuid,p_run uuid,p_score numeric,p_notes text,
 p_breakdown jsonb,p_review boolean,p_model text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_rows integer;
begin
 if p_score is not null and (p_score<0 or p_score>100) then raise exception 'SCORE_RANGE';end if;
 if p_breakdown is null or jsonb_typeof(p_breakdown)<>'array' then raise exception 'INVALID_BREAKDOWN';end if;
 update public.nabd_quality_submissions s
 set ai_score=p_score,ai_notes=left(coalesce(p_notes,''),6000),
  ai_breakdown=p_breakdown,ai_status=case when p_score is null then 'needs_review' else 'graded' end,
  ai_review_required=coalesce(p_review,true),ai_graded_at=now(),ai_model=left(p_model,120),
  ai_run_id=null,ai_claimed_at=null
 where s.id=p_id and s.ai_run_id=p_run and s.ai_status='processing'
 and s.human_score is null
 and exists(select 1 from public.nabd_gradebot_settings c where c.singleton and c.enabled);
 get diagnostics v_rows = row_count;
 if v_rows=1 then
  update public.nabd_gradebot_settings set last_run=now(),last_error=null,
   total_graded=total_graded+1 where singleton;
 end if;
 return v_rows=1;
end $$;
revoke all on function public.nabd_gradebot_finish(uuid,uuid,numeric,text,jsonb,boolean,text)
 from public,anon,authenticated;
grant execute on function public.nabd_gradebot_finish(uuid,uuid,numeric,text,jsonb,boolean,text) to service_role;

create or replace function public.nabd_gradebot_fail(p_id uuid,p_run uuid,p_error text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_rows integer;
begin
 update public.nabd_quality_submissions
  set ai_status='needs_review',ai_review_required=true,
   ai_notes='تعذّر التصحيح الآلي لهذه الإجابة؛ تتطلب مراجعة بشرية.',
   ai_claimed_at=null,ai_run_id=null
  where id=p_id and ai_run_id=p_run and ai_status='processing';
 get diagnostics v_rows=row_count;
 update public.nabd_gradebot_settings set last_run=now(),last_error=left(p_error,400) where singleton;
 return v_rows=1;
end $$;
revoke all on function public.nabd_gradebot_fail(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.nabd_gradebot_fail(uuid,uuid,text) to service_role;
