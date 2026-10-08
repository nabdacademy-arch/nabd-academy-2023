-- NABD Executive Portal v1
-- Run in the Supabase project SQL editor as the project owner.
-- Isolated portal_* tables; does not alter existing courses, students or certificates.
-- Make a database backup/snapshot and review first if the project already has similar tables.

create schema if not exists nabd_portal_private;

do $$ begin
  create type public.portal_role as enum (
    'founder','deputy','academic','research','operations','partnerships',
    'scholarships','finance','media','technology','hr','secretary'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.portal_task_status as enum ('todo','in_progress','done');
exception when duplicate_object then null;
end $$;

create table if not exists public.portal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  role public.portal_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  details text not null default '' check (char_length(details)<=2000),
  assigned_role public.portal_role not null,
  assigned_user uuid references public.portal_profiles(user_id) on delete set null,
  created_by uuid not null references auth.users(id),
  status public.portal_task_status not null default 'todo',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_activity (
  id bigint generated always as identity primary key,
  task_id uuid,
  action text not null check (action in ('created','updated')),
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists portal_tasks_role_idx on public.portal_tasks(assigned_role,created_at desc);
create index if not exists portal_tasks_user_idx on public.portal_tasks(assigned_user,created_at desc);
create index if not exists portal_activity_created_idx on public.portal_activity(created_at desc);

alter table public.portal_profiles enable row level security;
alter table public.portal_tasks enable row level security;
alter table public.portal_activity enable row level security;

-- Only this definer can look up current user role without recursive RLS.
-- The private schema must NOT be added to API > Exposed schemas.
create or replace function nabd_portal_private.nabd_current_portal_role()
returns public.portal_role language sql stable security definer set search_path = '' as $$
  select p.role from public.portal_profiles p
  where p.user_id = (select auth.uid()) and p.is_active = true
  limit 1
$$;

-- Automatically log task creations/status changes. Do not log sensitive task details.
create or replace function nabd_portal_private.nabd_portal_audit_task()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.portal_activity (task_id,action,actor_id)
    values (new.id,'created',(select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.portal_activity (task_id,action,actor_id)
    values (new.id,'updated',(select auth.uid()));
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists nabd_portal_task_audit_trigger on public.portal_tasks;
create trigger nabd_portal_task_audit_trigger
before insert or update on public.portal_tasks
for each row execute function nabd_portal_private.nabd_portal_audit_task();

-- Explicit privileges: no anonymous access; client may never edit role assignments.
revoke all on table public.portal_profiles from public, anon, authenticated;
revoke all on table public.portal_tasks from public, anon, authenticated;
revoke all on table public.portal_activity from public, anon, authenticated;
grant select on public.portal_profiles to authenticated;
grant select, insert on public.portal_tasks to authenticated;
grant update (status) on public.portal_tasks to authenticated;
grant select on public.portal_activity to authenticated;
grant usage on type public.portal_role to authenticated;
grant usage on type public.portal_task_status to authenticated;
revoke all on schema nabd_portal_private from public, anon;
grant usage on schema nabd_portal_private to authenticated;
revoke all on function nabd_portal_private.nabd_current_portal_role() from public, anon;
grant execute on function nabd_portal_private.nabd_current_portal_role() to authenticated;
revoke all on function nabd_portal_private.nabd_portal_audit_task() from public, anon, authenticated;

-- Existing policies are dropped only on new portal-prefixed tables.
drop policy if exists "portal_profiles_select" on public.portal_profiles;
create policy "portal_profiles_select" on public.portal_profiles
for select to authenticated using (
  user_id = (select auth.uid()) or
  (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role
);

drop policy if exists "portal_tasks_select" on public.portal_tasks;
create policy "portal_tasks_select" on public.portal_tasks
for select to authenticated using (
  (select nabd_portal_private.nabd_current_portal_role()) is not null and (
    (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role or
    (assigned_user is not null and assigned_user = (select auth.uid())) or
    (assigned_user is null and assigned_role = (select nabd_portal_private.nabd_current_portal_role()))
  )
);

drop policy if exists "portal_tasks_insert" on public.portal_tasks;
create policy "portal_tasks_insert" on public.portal_tasks
for insert to authenticated with check (
  (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role
  and created_by = (select auth.uid())
);

drop policy if exists "portal_tasks_update_status" on public.portal_tasks;
create policy "portal_tasks_update_status" on public.portal_tasks
for update to authenticated
using (
  (select nabd_portal_private.nabd_current_portal_role()) is not null and (
    (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role or
    (assigned_user is not null and assigned_user = (select auth.uid())) or
    (assigned_user is null and assigned_role = (select nabd_portal_private.nabd_current_portal_role()))
  )
)
with check (
  (select nabd_portal_private.nabd_current_portal_role()) is not null and (
    (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role or
    (assigned_user is not null and assigned_user = (select auth.uid())) or
    (assigned_user is null and assigned_role = (select nabd_portal_private.nabd_current_portal_role()))
  )
);

drop policy if exists "portal_activity_select" on public.portal_activity;
create policy "portal_activity_select" on public.portal_activity
for select to authenticated using (
  (select nabd_portal_private.nabd_current_portal_role()) = 'founder'::public.portal_role
);

-- Optional: to enforce one active holder per executive role, enable the index below.
-- create unique index portal_one_active_holder_per_role
--   on public.portal_profiles(role) where is_active and role <> 'founder';

-- MANUAL BOOTSTRAP (do not execute without replacing the ID):
-- 1) Supabase Dashboard -> Authentication -> Users -> Add user (email + secure password).
-- 2) Copy the newly created Auth user's UUID.
-- 3) Run separately, replacing <AUTH_USER_UUID> with that exact UUID:
-- insert into public.portal_profiles (user_id,full_name,role,is_active)
-- values ('<AUTH_USER_UUID>','Mohammed Khaled Al-Arja','founder',true);
-- 4) Repeat for each approved executive user with role deputy/academic/etc.
-- NEVER insert service_role keys, personal passwords or secret tokens in this SQL file.
