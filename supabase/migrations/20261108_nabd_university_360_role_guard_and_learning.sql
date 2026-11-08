-- NABD UNIVERSITY 360
-- Production migration already applied through the connected Supabase deployment (2026-11-08).
-- Apply only to an environment with the existing public.profiles, public.courses and public.is_admin().
-- Role guard closes self-service privilege escalation in the existing profiles UPDATE policy.
create or replace function public.nabd_360_guard_profile_authority()
returns trigger language plpgsql security invoker set search_path = pg_catalog,public
as $guard$
begin
  if current_user not in ('postgres','service_role') and not coalesce(public.is_admin(),false) then
    if new.role is distinct from old.role or new.id is distinct from old.id
       or new.email is distinct from old.email or new.created_at is distinct from old.created_at then
      raise exception 'Profile authority fields require administrator review' using errcode='42501';
    end if;
  end if;
  return new;
end;
$guard$;
drop trigger if exists nabd_360_guard_profile_authority on public.profiles;
create trigger nabd_360_guard_profile_authority before update on public.profiles
for each row execute function public.nabd_360_guard_profile_authority();

create table if not exists public.nabd_360_study_plans (
 user_id uuid primary key references auth.users(id) on delete cascade,
 course_id uuid references public.courses(id) on delete set null,
 weekly_goal_minutes integer not null default 180 check(weekly_goal_minutes between 30 and 900),
 focus_note text not null default '' check(char_length(focus_note)<=240),
 updated_at timestamptz not null default now()
);
create table if not exists public.nabd_360_lecturer_applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null unique references auth.users(id) on delete cascade,
 full_name text not null check(char_length(btrim(full_name)) between 4 and 140),
 expertise text not null check(char_length(btrim(expertise)) between 4 and 160),
 institution text not null check(char_length(btrim(institution)) between 2 and 180),
 country text not null check(char_length(btrim(country)) between 2 and 90),
 contact_email text not null check(char_length(btrim(contact_email)) between 6 and 180),
 offer_topic text not null check(char_length(btrim(offer_topic)) between 10 and 800),
 weekly_hours integer not null default 1 check(weekly_hours between 1 and 12),
 consent boolean not null default false check(consent=true),
 status text not null default 'pending' check(status in ('pending','reviewing','approved','declined')),
 admin_note text check(admin_note is null or char_length(admin_note)<=600),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists nabd_360_lecturer_status_created on public.nabd_360_lecturer_applications(status,created_at desc);
alter table public.nabd_360_study_plans enable row level security;
alter table public.nabd_360_lecturer_applications enable row level security;
revoke all on public.nabd_360_study_plans from public,anon,authenticated;
revoke all on public.nabd_360_lecturer_applications from public,anon,authenticated;
grant select,insert on public.nabd_360_study_plans to authenticated;
grant update(course_id,weekly_goal_minutes,focus_note,updated_at) on public.nabd_360_study_plans to authenticated;
grant select,insert on public.nabd_360_lecturer_applications to authenticated;
grant update(status,admin_note,reviewed_at) on public.nabd_360_lecturer_applications to authenticated;
create policy nabd_360_plans_read on public.nabd_360_study_plans for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy nabd_360_plans_create on public.nabd_360_study_plans for insert to authenticated
 with check(user_id=(select auth.uid()));
create policy nabd_360_plans_update on public.nabd_360_study_plans for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy nabd_360_applications_read on public.nabd_360_lecturer_applications for select to authenticated
 using(applicant_id=(select auth.uid()) or (select public.is_admin()));
create policy nabd_360_applications_create on public.nabd_360_lecturer_applications for insert to authenticated
 with check(applicant_id=(select auth.uid()) and status='pending'
 and consent=true and admin_note is null and reviewed_at is null);
create policy nabd_360_applications_admin_review on public.nabd_360_lecturer_applications for update to authenticated
 using((select public.is_admin())) with check((select public.is_admin()));
comment on table public.nabd_360_lecturer_applications is 'Private voluntary faculty applications: status approval is not a teaching appointment or institutional affiliation.';
comment on table public.nabd_360_study_plans is 'Owner-scoped study goals only. Not exam marks or credentials.';