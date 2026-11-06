-- NABD Campus: additive, isolated global-lecture schedule and student RSVP.
-- Does not modify students, courses, certificates, or existing clinical modules.
-- Admins may schedule/publish; visitors can see ONLY published sessions.
-- Never store a meeting access link or patient information in these public rows.
begin;

create table if not exists public.nabd_global_sessions (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null check (char_length(btrim(title_ar)) between 4 and 180),
  title_en text not null check (char_length(btrim(title_en)) between 4 and 180),
  topic_ar text not null default '',
  topic_en text not null default '',
  speaker_name text not null default '',
  speaker_affiliation text not null default '',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 30 and 180),
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nabd_global_sessions_public
  on public.nabd_global_sessions(status,scheduled_at);

create table if not exists public.nabd_global_session_signups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.nabd_global_sessions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id,student_id)
);

create index if not exists idx_nabd_global_signups_student
  on public.nabd_global_session_signups(student_id,session_id);

alter table public.nabd_global_sessions enable row level security;
alter table public.nabd_global_session_signups enable row level security;

revoke all on public.nabd_global_sessions from anon,authenticated;
revoke all on public.nabd_global_session_signups from anon,authenticated;

grant select on public.nabd_global_sessions to anon,authenticated;
grant insert,update,delete on public.nabd_global_sessions to authenticated;
grant select,insert,delete,update on public.nabd_global_session_signups to authenticated;

drop policy if exists nabd_sessions_visible on public.nabd_global_sessions;
create policy nabd_sessions_visible on public.nabd_global_sessions
  for select to anon,authenticated
  using (status = 'published' or (select public.is_admin()));

drop policy if exists nabd_sessions_admin_create on public.nabd_global_sessions;
create policy nabd_sessions_admin_create on public.nabd_global_sessions
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists nabd_sessions_admin_update on public.nabd_global_sessions;
create policy nabd_sessions_admin_update on public.nabd_global_sessions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists nabd_sessions_admin_delete on public.nabd_global_sessions;
create policy nabd_sessions_admin_delete on public.nabd_global_sessions
  for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists nabd_session_signups_read on public.nabd_global_session_signups;
create policy nabd_session_signups_read on public.nabd_global_session_signups
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists nabd_session_signups_student_insert on public.nabd_global_session_signups;
create policy nabd_session_signups_student_insert on public.nabd_global_session_signups
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and attended = false
    and exists (
      select 1 from public.nabd_global_sessions s
      where s.id = session_id
        and s.status = 'published'
        and s.scheduled_at > now()
    )
  );

drop policy if exists nabd_session_signups_student_cancel on public.nabd_global_session_signups;
create policy nabd_session_signups_student_cancel on public.nabd_global_session_signups
  for delete to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists nabd_session_signups_admin_attendance on public.nabd_global_session_signups;
create policy nabd_session_signups_admin_attendance on public.nabd_global_session_signups
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

comment on table public.nabd_global_sessions is
 'NABD non-credit guest lectures. Sessions stay draft until a verified coordinator publishes.';
comment on table public.nabd_global_session_signups is
 'Private learner registrations. Attendance may only be changed by an administrator.';

commit;
