-- NABD Examinations & Quality · transparent, optional, per-exam browser-signal proctor.
-- This is NOT a screen recorder and screenshot signals are not proof of a screenshot.
begin;

create table if not exists public.nabd_quality_proctor_settings (
  exam_id uuid primary key references public.nabd_quality_exams(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.nabd_quality_proctor_settings enable row level security;
revoke all on public.nabd_quality_proctor_settings from public,anon,authenticated;

create table if not exists public.nabd_quality_proctor_events (
  id bigint generated always as identity primary key,
  exam_id uuid not null references public.nabd_quality_exams(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  signal_type text not null check (signal_type in (
    'tab_hidden','window_blur','printscreen_key','print_shortcut','copy_attempt'
  )),
  detected_at timestamptz not null default now()
);
alter table public.nabd_quality_proctor_events enable row level security;
revoke all on public.nabd_quality_proctor_events from public,anon,authenticated;
create index if not exists nabd_quality_proctor_events_recent
  on public.nabd_quality_proctor_events(exam_id,detected_at desc);
create index if not exists nabd_quality_proctor_student_rate
  on public.nabd_quality_proctor_events(exam_id,student_id,detected_at desc);

create or replace function public.nabd_quality_proctor_toggle(p_exam uuid,p_enabled boolean)
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid := (select auth.uid());
  v_status text;
  v_open timestamptz;
  v_close timestamptz;
begin
  if v_uid is null or not exists(
    select 1 from public.nabd_exam_owner o where o.user_id=v_uid
  ) then raise exception 'DIRECTOR_ONLY'; end if;
  if p_enabled is null then raise exception 'INVALID_SETTING'; end if;
  select x.status,x.opens_at,x.closes_at
    into v_status,v_open,v_close
    from public.nabd_quality_exams x
    where x.id=p_exam and x.created_by=v_uid;
  if not found then raise exception 'EXAM_NOT_FOUND'; end if;
  if p_enabled and not (
    v_status='published' and v_open<=now() and v_close>now()
  ) then raise exception 'EXAM_NOT_ACTIVE'; end if;

  insert into public.nabd_quality_proctor_settings (exam_id,enabled,updated_by,updated_at)
    values (p_exam,p_enabled,v_uid,now())
    on conflict (exam_id) do update
      set enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=excluded.updated_at;

  return jsonb_build_object('exam_id',p_exam,'enabled',p_enabled,'updated_at',now());
end $$;
revoke all on function public.nabd_quality_proctor_toggle(uuid,boolean) from public,anon;
grant execute on function public.nabd_quality_proctor_toggle(uuid,boolean) to authenticated;

-- Student can read only the on/off state of their own currently open exam.
create or replace function public.nabd_quality_proctor_student_state(p_exam uuid)
returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_enabled boolean := false;
begin
  if (select auth.uid()) is null or not exists(
    select 1 from public.profiles p
    where p.id=(select auth.uid()) and p.role='student'
  ) then raise exception 'STUDENT_ONLY'; end if;
  if not exists(
    select 1 from public.nabd_quality_exams x
    where x.id=p_exam and x.status='published'
      and x.opens_at<=now() and x.closes_at>now()
  ) then return jsonb_build_object('enabled',false,'open',false); end if;
  select s.enabled into v_enabled from public.nabd_quality_proctor_settings s
    where s.exam_id=p_exam;
  return jsonb_build_object('enabled',coalesce(v_enabled,false),'open',true);
end $$;
revoke all on function public.nabd_quality_proctor_student_state(uuid) from public,anon;
grant execute on function public.nabd_quality_proctor_student_state(uuid) to authenticated;

-- Untrusted browser signals are accepted only for the signed-in student's
-- own active exam while proctoring is ON. The server, not the browser, stamps time.
create or replace function public.nabd_quality_proctor_report(p_exam uuid,p_signal text)
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
begin
  if v_uid is null or not exists(
    select 1 from public.profiles p where p.id=v_uid and p.role='student'
  ) then raise exception 'STUDENT_ONLY'; end if;
  if p_signal is null or p_signal not in
    ('tab_hidden','window_blur','printscreen_key','print_shortcut','copy_attempt')
  then raise exception 'INVALID_SIGNAL'; end if;
  if not exists(
    select 1 from public.nabd_quality_exams x
    join public.nabd_quality_proctor_settings s on s.exam_id=x.id
    where x.id=p_exam and x.status='published'
      and x.opens_at<=now() and x.closes_at>now() and s.enabled=true
  ) then return jsonb_build_object('recorded',false,'reason','INACTIVE'); end if;
  if exists(
    select 1 from public.nabd_quality_submissions sub
    where sub.exam_id=p_exam and sub.student_id=v_uid
  ) then return jsonb_build_object('recorded',false,'reason','SUBMITTED'); end if;
  select count(*)::integer into v_count from public.nabd_quality_proctor_events e
    where e.exam_id=p_exam and e.student_id=v_uid;
  if v_count>=120 then return jsonb_build_object('recorded',false,'reason','CAP_REACHED'); end if;
  if exists(
    select 1 from public.nabd_quality_proctor_events e
    where e.exam_id=p_exam and e.student_id=v_uid and e.signal_type=p_signal
      and e.detected_at>now()-interval '5 seconds'
  ) then return jsonb_build_object('recorded',false,'reason','DUPLICATE'); end if;
  insert into public.nabd_quality_proctor_events(exam_id,student_id,signal_type)
    values (p_exam,v_uid,p_signal);
  return jsonb_build_object('recorded',true,'timestamp',now());
end $$;
revoke all on function public.nabd_quality_proctor_report(uuid,text) from public,anon;
grant execute on function public.nabd_quality_proctor_report(uuid,text) to authenticated;

-- Private director dashboard. Never expose direct student contact info.
create or replace function public.nabd_quality_proctor_dashboard(p_exam uuid)
returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_uid uuid := (select auth.uid()); v_result jsonb;
begin
  if v_uid is null or not exists(
    select 1 from public.nabd_exam_owner o where o.user_id=v_uid
  ) then raise exception 'DIRECTOR_ONLY'; end if;
  if not exists(
    select 1 from public.nabd_quality_exams x
    where x.id=p_exam and x.created_by=v_uid
  ) then raise exception 'EXAM_NOT_FOUND'; end if;
  select jsonb_build_object(
     'exam_id',x.id,
     'title',x.title,
     'enabled',coalesce(s.enabled,false),
     'updated_at',s.updated_at,
     'total', (select count(*) from public.nabd_quality_proctor_events e where e.exam_id=x.id),
     'events',coalesce((
       select jsonb_agg(to_jsonb(recent) order by recent.detected_at desc)
       from (
         select e.id,e.signal_type,e.detected_at,e.student_id,
           coalesce(nullif(btrim(p.full_name),''),'طالب') as student_name
         from public.nabd_quality_proctor_events e
         left join public.profiles p on p.id=e.student_id
         where e.exam_id=x.id
         order by e.detected_at desc
         limit 150
       ) recent
     ),'[]'::jsonb)
  ) into v_result
  from public.nabd_quality_exams x
  left join public.nabd_quality_proctor_settings s on s.exam_id=x.id
  where x.id=p_exam;
  return v_result;
end $$;
revoke all on function public.nabd_quality_proctor_dashboard(uuid) from public,anon;
grant execute on function public.nabd_quality_proctor_dashboard(uuid) to authenticated;

-- Low retention for potentially sensitive exam event metadata.
do $$
begin
  if not exists(select 1 from cron.job where jobname='nabd-quality-proctor-purge-30d') then
    perform cron.schedule(
      'nabd-quality-proctor-purge-30d',
      '30 3 * * *',
      'delete from public.nabd_quality_proctor_events where detected_at < now() - interval ''30 days'';'
    );
  end if;
end $$;
commit;
